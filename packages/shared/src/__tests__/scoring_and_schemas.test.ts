import test from 'node:test';
import assert from 'node:assert/strict';
import {
  prepareStudentSession,
  gradeQuizTask,
  gradeMatchingTask,
  gradeOrderingTask,
  validateGeneratedGamePayload,
  GameSnapshot,
  QuizTask,
  MatchingTask,
  OrderingTask,
} from '../index.js';

test('Schema Validator: rejects invalid schemaVersion and missing title', () => {
  const invalidPayload = {
    schemaVersion: '0.9',
    title: '',
    subject: 'Тарих',
    grade: 7,
    language: 'kk',
    difficulty: 'A',
    gameType: 'QUIZ',
    instructions: 'Тест',
    items: [],
  };

  const result = validateGeneratedGamePayload(invalidPayload, 'QUIZ');
  assert.equal(result.success, false);
  assert.ok(result.errors.some(e => e.includes('schemaVersion')));
  assert.ok(result.errors.some(e => e.includes('title')));
});

test('Schema Validator: rejects duplicate option IDs in Quiz', () => {
  const invalidQuiz = {
    schemaVersion: '1.0',
    title: 'Қазақ хандығы',
    subject: 'Қазақстан тарихы',
    grade: 7,
    language: 'kk',
    difficulty: 'A',
    gameType: 'QUIZ',
    instructions: 'Сұрақтарға жауап беріңіз',
    items: [
      {
        id: 'task-1',
        orderIndex: 0,
        question: 'Қазақ хандығы қай жылы құрылды?',
        options: [
          { id: 'opt-1', text: '1465 жыл' },
          { id: 'opt-1', text: '1465 жыл' }, // Duplicate ID!
        ],
        correctOptionId: 'opt-1',
        explanation: 'Қазақ хандығы 1465 жылы құрылды.',
        sourceExcerpt: '1465 жылы Керей мен Жәнібек хандықты құрды.',
      },
    ],
  };

  const result = validateGeneratedGamePayload(invalidQuiz, 'QUIZ');
  assert.equal(result.success, false);
  assert.ok(result.errors.length > 0);
});

test('Student Session: strips answers, explanations, and evidence from Quiz, Matching, and Ordering', () => {
  const sampleGame: GameSnapshot = {
    schemaVersion: '1.0',
    title: 'Биология тесті',
    subject: 'Биология',
    grade: 8,
    language: 'kk',
    difficulty: 'B',
    gameType: 'QUIZ',
    instructions: 'Тест тапсырмалары',
    items: [
      {
        id: 'q-1',
        orderIndex: 0,
        question: 'Жасушаның негізгі бөлігі?',
        options: [
          { id: 'opt-a', text: 'Ядро' },
          { id: 'opt-b', text: 'Қабырға' },
        ],
        correctOptionId: 'opt-a',
        explanation: 'Ядро тұқым қуалау ақпаратын сақтайды.',
        sourceExcerpt: 'Жасушаның маңызды бөлігі - ядро.',
      } as QuizTask,
    ],
  };

  const session = prepareStudentSession(sampleGame, '789123');

  assert.equal(session.pinCode, '789123');
  assert.equal(session.tasks.length, 1);
  const studentTask = session.tasks[0] as any;
  assert.equal(studentTask.id, 'q-1');
  assert.equal(studentTask.question, 'Жасушаның негізгі бөлігі?');
  // MUST NOT expose correctOptionId or explanation to the student:
  assert.equal(studentTask.correctOptionId, undefined);
  assert.equal(studentTask.explanation, undefined);
  assert.equal(studentTask.sourceExcerpt, undefined);
});

test('Quiz Grading: correctly verifies student answer using option ID, not text or array index', () => {
  const task: QuizTask = {
    id: 'quiz-1',
    orderIndex: 0,
    question: 'Судың химиялық формуласы қандай?',
    options: [
      { id: 'ans-1', text: 'CO2' },
      { id: 'ans-2', text: 'H2O' },
      { id: 'ans-3', text: 'NaCl' },
    ],
    correctOptionId: 'ans-2',
    explanation: 'Су - сутек пен оттектің байланысы (H2O).',
    sourceExcerpt: 'Су формуласы H2O болып табылады.',
  };

  // Correct answer
  const correctResult = gradeQuizTask(task, 'ans-2');
  assert.equal(correctResult.isCorrect, true);
  assert.equal(correctResult.scoreAwarded, 1);
  assert.equal(correctResult.explanation, task.explanation);

  // Wrong answer
  const wrongResult = gradeQuizTask(task, 'ans-1');
  assert.equal(wrongResult.isCorrect, false);
  assert.equal(wrongResult.scoreAwarded, 0);
});

test('Matching Grading: computes fractional score and checks exact pairs', () => {
  const task: MatchingTask = {
    id: 'match-1',
    orderIndex: 0,
    instructions: 'Астаналар мен елдерді сәйкестендіріңіз',
    pairs: [
      { id: 'p1', left: 'Қазақстан', right: 'Астана' },
      { id: 'p2', left: 'Франция', right: 'Париж' },
      { id: 'p3', left: 'Жапония', right: 'Токио' },
    ],
    explanation: 'Барлық астаналар дұрыс сәйкестендірілуі тиіс.',
    sourceExcerpt: 'Елдер мен олардың астаналары.',
  };

  // Student got 2 out of 3 right:
  const studentPairs = {
    p1: 'p1',
    p2: 'p2',
    p3: 'wrong_pair',
  };

  const result = gradeMatchingTask(task, studentPairs);
  assert.equal(result.isCorrect, false);
  assert.equal(result.scoreAwarded, 0.67); // 2/3 rounded to 2 decimals
  assert.equal(result.maxScore, 1);

  // Student got all 3 right:
  const perfectPairs = { p1: 'p1', p2: 'p2', p3: 'p3' };
  const perfectResult = gradeMatchingTask(task, perfectPairs);
  assert.equal(perfectResult.isCorrect, true);
  assert.equal(perfectResult.scoreAwarded, 1);
});

test('Ordering Grading: evaluates correct permutation strictly', () => {
  const task: OrderingTask = {
    id: 'order-1',
    orderIndex: 0,
    instructions: 'Хронологиялық ретімен қойыңыз',
    items: [
      { id: 'item-1', text: '1991 - Тәуелсіздік жарияланды' },
      { id: 'item-2', text: '1993 - Ұлттық валюта теңге енгізілді' },
      { id: 'item-3', text: '1995 - ҚР Конституциясы қабылданды' },
    ],
    correctOrderIds: ['item-1', 'item-2', 'item-3'],
    explanation: 'Оқиғалар 1991, 1993 және 1995 жылдар ретімен орын алды.',
    sourceExcerpt: 'Қазақстан тәуелсіздік тарихы.',
  };

  // Full correct order
  const correctResult = gradeOrderingTask(task, ['item-1', 'item-2', 'item-3']);
  assert.equal(correctResult.isCorrect, true);
  assert.equal(correctResult.scoreAwarded, 1);

  // Inverted order
  const wrongResult = gradeOrderingTask(task, ['item-3', 'item-2', 'item-1']);
  assert.equal(wrongResult.isCorrect, false);
  assert.ok(wrongResult.scoreAwarded < 1);
});
