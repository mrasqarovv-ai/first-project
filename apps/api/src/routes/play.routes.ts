import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import {
  prepareStudentSession,
  gradeGameAttempt,
  StudentAnswersPayloadSchema,
  GameSnapshot,
} from '@oquplay/shared';

export async function playRoutes(fastify: FastifyInstance) {
  // Join game session via 6-digit PIN code
  fastify.get('/join/:pinCode', async (request, reply) => {
    const { pinCode } = request.params as { pinCode: string };

    const session = await prisma.shareSession.findUnique({
      where: { pinCode },
      include: {
        gameVersion: {
          include: {
            game: true,
          },
        },
      },
    });

    if (!session || !session.isActive) {
      return reply.status(404).send({
        error: 'Ойын табылмады немесе жабылды. Кодты дұрыс енгізгеніңізді тексеріңіз.',
      });
    }

    let snapshot: GameSnapshot;
    try {
      snapshot = JSON.parse(session.gameVersion.snapshotJson);
    } catch {
      return reply.status(500).send({ error: 'Ойын мәліметтері зақымдалған' });
    }

    // Crucial: Prepare session with STRIPPED answers, explanations and shuffled items
    const studentSession = prepareStudentSession(snapshot, pinCode);

    return reply.send({
      session: studentSession,
      isDemo: Boolean(snapshot.isDemo),
    });
  });

  // Submit completed game attempt
  fastify.post('/submit/:pinCode', async (request, reply) => {
    const { pinCode } = request.params as { pinCode: string };
    const body = request.body as any;

    const parse = StudentAnswersPayloadSchema.safeParse(body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Жауаптар форматы қате',
        details: parse.error.errors.map((e: any) => e.message),
      });
    }

    const { studentName, timeSpentSeconds, answers } = parse.data;

    const session = await prisma.shareSession.findUnique({
      where: { pinCode },
      include: {
        gameVersion: {
          include: {
            game: true,
          },
        },
      },
    });

    if (!session || !session.isActive) {
      return reply.status(400).send({ error: 'Бұл ойын белсенді емес' });
    }

    let snapshot: GameSnapshot;
    try {
      snapshot = JSON.parse(session.gameVersion.snapshotJson);
    } catch {
      return reply.status(500).send({ error: 'Ойын дерегі қате' });
    }

    // Check optional authenticated user
    let authUserId: string | null = null;
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = (fastify as any).jwt.verify(token) as any;
        authUserId = decoded?.id || null;
      } catch {}
    }

    // Server-side grading: NEVER trust scores sent by client
    const gradeResult = gradeGameAttempt(
      snapshot,
      answers,
      timeSpentSeconds,
      pinCode,
      authUserId || undefined,
      studentName
    );

    // Save Attempt and individual answers to database
    const attempt = await prisma.attempt.create({
      data: {
        shareSessionId: session.id,
        userId: authUserId,
        guestName: studentName || 'Қонақ',
        score: gradeResult.score,
        maxScore: gradeResult.maxScore,
        percentage: gradeResult.percentage,
        timeSpentSeconds: gradeResult.timeSpentSeconds,
        badge: gradeResult.badge,
        answers: {
          create: gradeResult.tasks.map((task: any) => ({
            taskId: task.taskId,
            studentAnswerJson: JSON.stringify(task.studentAnswer),
            isCorrect: task.isCorrect,
            scoreAwarded: task.scoreAwarded,
            maxScore: task.maxScore,
          })),
        },
      },
    });

    return reply.status(201).send({
      ...gradeResult,
      attemptId: attempt.id,
    });
  });

  // Get specific attempt result
  fastify.get('/attempt/:attemptId', async (request, reply) => {
    const { attemptId } = request.params as { attemptId: string };

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        shareSession: {
          include: {
            gameVersion: {
              include: {
                game: true,
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return reply.status(404).send({ error: 'Нәтиже табылмады' });
    }

    let snapshot: GameSnapshot | null = null;
    try {
      snapshot = JSON.parse(attempt.shareSession.gameVersion.snapshotJson);
    } catch {}

    // Map answers with explanations from the snapshot
    const taskResults = attempt.answers.map((ans) => {
      let parsedAnswer: any;
      try {
        parsedAnswer = JSON.parse(ans.studentAnswerJson);
      } catch {
        parsedAnswer = ans.studentAnswerJson;
      }

      const originalItem = snapshot?.items.find((item) => item.id === ans.taskId);

      return {
        taskId: ans.taskId,
        isCorrect: ans.isCorrect,
        scoreAwarded: ans.scoreAwarded,
        maxScore: ans.maxScore,
        explanation: originalItem?.explanation || '',
        sourceExcerpt: originalItem?.sourceExcerpt || '',
        studentAnswer: parsedAnswer,
      };
    });

    return reply.send({
      attemptId: attempt.id,
      gameTitle: attempt.shareSession.gameVersion.game.title,
      gameType: attempt.shareSession.gameVersion.game.gameType,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      timeSpentSeconds: attempt.timeSpentSeconds,
      badge: attempt.badge,
      completedAt: attempt.completedAt.toISOString(),
      tasks: taskResults,
    });
  });
}
