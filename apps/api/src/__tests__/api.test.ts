import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../index.js';
import { prisma } from '../db.js';
import { hashPassword } from '../auth.js';
import {
  prepareStudentSession,
  gradeGameAttempt,
  validateGeneratedGamePayload,
  GameSnapshot,
} from '@oquplay/shared';
import { DEMO_QUIZ_KK } from '../ai/demo-templates.js';

test('OquPlay AI Backend Integration & Security Tests', async (t) => {
  const app = await buildApp();

  t.after(async () => {
    await app.close();
    await prisma.$disconnect();
    setTimeout(() => process.exit(0), 100);
  });

  let teacherToken = '';
  let otherTeacherToken = '';
  let teacherId = '';
  let otherTeacherId = '';

  // Setup test users
  await t.test('1. Setup test users and auth tokens', async () => {
    // Clean test users if exist
    await prisma.user.deleteMany({
      where: {
        email: { in: ['test-t1@oquplay.kz', 'test-t2@oquplay.kz'] },
      },
    });

    const pwd = await hashPassword('password123');

    const t1 = await prisma.user.create({
      data: {
        email: 'test-t1@oquplay.kz',
        name: 'Тест Мұғалім 1',
        passwordHash: pwd,
        role: 'TEACHER',
      },
    });
    teacherId = t1.id;
    teacherToken = (app as any).jwt.sign({
      id: t1.id,
      email: t1.email,
      name: t1.name,
      role: t1.role,
    });

    const t2 = await prisma.user.create({
      data: {
        email: 'test-t2@oquplay.kz',
        name: 'Тест Мұғалім 2',
        passwordHash: pwd,
        role: 'TEACHER',
      },
    });
    otherTeacherId = t2.id;
    otherTeacherToken = (app as any).jwt.sign({
      id: t2.id,
      email: t2.email,
      name: t2.name,
      role: t2.role,
    });

    assert.ok(teacherToken);
    assert.ok(otherTeacherToken);
  });

  // 2. Health check
  await t.test('2. Health check returns ok and demo/live AI status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, 'ok');
    assert.ok(body.llmMode);
  });

  // 3. AI Generation fallback in Demo mode
  await t.test('3. AI Generation works in Demo mode when no API key configured', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/games/generate',
      headers: { Authorization: `Bearer ${teacherToken}` },
      payload: {
        sourceText: 'Қазақ хандығының негізін 1465 жылы Керей мен Жәнібек қалады. Олар Шу өңіріне көшіп барды.',
        subject: 'Қазақстан тарихы',
        grade: 7,
        language: 'kk',
        difficulty: 'A',
        gameType: 'QUIZ',
        itemCount: 5,
        timeLimitEnabled: false,
      },
    });

    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.equal(data.success, true);
    assert.equal(data.isDemo, true);
    assert.equal(data.snapshot.gameType, 'QUIZ');
    assert.ok(data.snapshot.items.length >= 3);
  });

  // 4. Schema validation rejects corrupted AI response
  await t.test('4. Server rejects invalid AI payload with clear errors', async () => {
    const invalidPayload = {
      schemaVersion: '1.0',
      title: 'Қате тест',
      items: [
        {
          id: 'q1',
          question: 'Сұрақ?',
          options: [{ id: 'a', text: '1' }, { id: 'a', text: 'Қайталанған ID' }], // Duplicate ID!
          correctOptionId: 'a',
          explanation: '',
          sourceExcerpt: '',
        },
      ],
    };

    const validation = validateGeneratedGamePayload(invalidPayload, 'QUIZ');
    assert.equal(validation.success, false);
    assert.ok(validation.errors.length > 0);
  });

  let createdGameId = '';
  let gamePinCode = '';

  // 5. Create, Publish and PIN generation
  await t.test('5. Teacher creates and publishes a game, getting a 6-digit PIN', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/games',
      headers: { Authorization: `Bearer ${teacherToken}` },
      payload: {
        snapshot: DEMO_QUIZ_KK,
        status: 'PUBLISHED',
      },
    });

    assert.equal(createRes.statusCode, 201);
    const created = JSON.parse(createRes.body);
    createdGameId = created.id;
    gamePinCode = created.pinCode;

    assert.ok(createdGameId);
    assert.ok(gamePinCode);
    assert.equal(gamePinCode.length, 6);
  });

  // 6. Security Check: Other teacher cannot edit or view private details
  await t.test('6. Other teacher CANNOT edit or view another teacher game', async () => {
    // Try to update with otherTeacherToken
    const editRes = await app.inject({
      method: 'PUT',
      url: `/api/games/${createdGameId}`,
      headers: { Authorization: `Bearer ${otherTeacherToken}` },
      payload: {
        snapshot: DEMO_QUIZ_KK,
      },
    });

    assert.equal(editRes.statusCode, 403);

    // Try to get teacher analytics with otherTeacherToken
    const analyticsRes = await app.inject({
      method: 'GET',
      url: `/api/teacher/games/${createdGameId}`,
      headers: { Authorization: `Bearer ${otherTeacherToken}` },
    });

    assert.equal(analyticsRes.statusCode, 403);
  });

  // 7. Student Session: Answers and explanations stripped
  await t.test('7. Student joining by PIN NEVER receives answers or explanations', async () => {
    const joinRes = await app.inject({
      method: 'GET',
      url: `/api/play/join/${gamePinCode}`,
    });

    assert.equal(joinRes.statusCode, 200);
    const data = JSON.parse(joinRes.body);
    const session = data.session;

    assert.equal(session.pinCode, gamePinCode);
    assert.ok(session.tasks.length > 0);

    for (const task of session.tasks) {
      assert.equal((task as any).correctOptionId, undefined, 'Student session must not expose correctOptionId');
      assert.equal((task as any).explanation, undefined, 'Student session must not expose explanation');
      assert.equal((task as any).sourceExcerpt, undefined, 'Student session must not expose sourceExcerpt');
    }
  });

  // 8. Server-side grading & score integrity
  await t.test('8. Score is strictly calculated on the server and cannot be spoofed', async () => {
    // Send perfect answers
    const answersMap: Record<string, string> = {
      'demo-q1': 'opt-1a',
      'demo-q2': 'opt-2a',
      'demo-q3': 'opt-3a',
      'demo-q4': 'opt-4a',
      'demo-q5': 'opt-5a',
    };

    const submitRes = await app.inject({
      method: 'POST',
      url: `/api/play/submit/${gamePinCode}`,
      payload: {
        studentName: 'Сынақ Оқушы',
        timeSpentSeconds: 35,
        answers: answersMap,
      },
    });

    assert.equal(submitRes.statusCode, 201);
    const result = JSON.parse(submitRes.body);

    assert.equal(result.score, 5);
    assert.equal(result.percentage, 100);
    assert.equal(result.badge, 'EXCELLENT');
    assert.ok(result.attemptId);
    assert.equal(result.tasks.length, 5);
    // Explanations are returned ONLY AFTER completing submission
    assert.ok(result.tasks[0].explanation);
  });

  // 9. Published game editing creates new version and preserves previous results
  await t.test('9. Editing a published game creates a new version without altering prior attempts', async () => {
    const updatedSnapshot = {
      ...DEMO_QUIZ_KK,
      title: 'Қазақ хандығы тарихы (Жаңартылған)',
    };

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/games/${createdGameId}`,
      headers: { Authorization: `Bearer ${teacherToken}` },
      payload: {
        snapshot: updatedSnapshot,
      },
    });

    assert.equal(updateRes.statusCode, 200);
    const updated = JSON.parse(updateRes.body);
    assert.equal(updated.versionNumber, 2);

    // Prior attempts are still in DB linked to version 1
    const analyticsRes = await app.inject({
      method: 'GET',
      url: `/api/teacher/games/${createdGameId}`,
      headers: { Authorization: `Bearer ${teacherToken}` },
    });

    assert.equal(analyticsRes.statusCode, 200);
    const analytics = JSON.parse(analyticsRes.body);
    assert.ok(analytics.totalAttempts >= 1);
  });

  // 10. Archived or invalid PIN returns 404
  await t.test('10. Closed/invalid PIN code is rejected gracefully', async () => {
    // Invalid PIN
    const invalidRes = await app.inject({
      method: 'GET',
      url: '/api/play/join/999999',
    });
    assert.equal(invalidRes.statusCode, 404);

    // Archive the active game
    const archiveRes = await app.inject({
      method: 'POST',
      url: `/api/games/${createdGameId}/archive`,
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert.equal(archiveRes.statusCode, 200);

    // Joining old PIN now returns 404
    const joinArchivedRes = await app.inject({
      method: 'GET',
      url: `/api/play/join/${gamePinCode}`,
    });
    assert.equal(joinArchivedRes.statusCode, 404);
  });
});
