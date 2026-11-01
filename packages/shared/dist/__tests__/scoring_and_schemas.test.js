"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const index_js_1 = require("../index.js");
(0, node_test_1.default)('Schema Validator: rejects invalid schemaVersion and missing title', () => {
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
    const result = (0, index_js_1.validateGeneratedGamePayload)(invalidPayload, 'QUIZ');
    strict_1.default.equal(result.success, false);
    strict_1.default.ok(result.errors.some(e => e.includes('schemaVersion')));
    strict_1.default.ok(result.errors.some(e => e.includes('title')));
});
(0, node_test_1.default)('Schema Validator: rejects duplicate option IDs in Quiz', () => {
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
    const result = (0, index_js_1.validateGeneratedGamePayload)(invalidQuiz, 'QUIZ');
    strict_1.default.equal(result.success, false);
    strict_1.default.ok(result.errors.length > 0);
});
(0, node_test_1.default)('Student Session: strips answers, explanations, and evidence from Quiz, Matching, and Ordering', () => {
    const sampleGame = {
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
            },
        ],
    };
    const session = (0, index_js_1.prepareStudentSession)(sampleGame, '789123');
    strict_1.default.equal(session.pinCode, '789123');
    strict_1.default.equal(session.tasks.length, 1);
    const studentTask = session.tasks[0];
    strict_1.default.equal(studentTask.id, 'q-1');
    strict_1.default.equal(studentTask.question, 'Жасушаның негізгі бөлігі?');
    // MUST NOT expose correctOptionId or explanation to the student:
    strict_1.default.equal(studentTask.correctOptionId, undefined);
    strict_1.default.equal(studentTask.explanation, undefined);
    strict_1.default.equal(studentTask.sourceExcerpt, undefined);
});
(0, node_test_1.default)('Quiz Grading: correctly verifies student answer using option ID, not text or array index', () => {
    const task = {
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
    const correctResult = (0, index_js_1.gradeQuizTask)(task, 'ans-2');
    strict_1.default.equal(correctResult.isCorrect, true);
    strict_1.default.equal(correctResult.scoreAwarded, 1);
    strict_1.default.equal(correctResult.explanation, task.explanation);
    // Wrong answer
    const wrongResult = (0, index_js_1.gradeQuizTask)(task, 'ans-1');
    strict_1.default.equal(wrongResult.isCorrect, false);
    strict_1.default.equal(wrongResult.scoreAwarded, 0);
});
(0, node_test_1.default)('Matching Grading: computes fractional score and checks exact pairs', () => {
    const task = {
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
    const result = (0, index_js_1.gradeMatchingTask)(task, studentPairs);
    strict_1.default.equal(result.isCorrect, false);
    strict_1.default.equal(result.scoreAwarded, 0.67); // 2/3 rounded to 2 decimals
    strict_1.default.equal(result.maxScore, 1);
    // Student got all 3 right:
    const perfectPairs = { p1: 'p1', p2: 'p2', p3: 'p3' };
    const perfectResult = (0, index_js_1.gradeMatchingTask)(task, perfectPairs);
    strict_1.default.equal(perfectResult.isCorrect, true);
    strict_1.default.equal(perfectResult.scoreAwarded, 1);
});
(0, node_test_1.default)('Ordering Grading: evaluates correct permutation strictly', () => {
    const task = {
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
    const correctResult = (0, index_js_1.gradeOrderingTask)(task, ['item-1', 'item-2', 'item-3']);
    strict_1.default.equal(correctResult.isCorrect, true);
    strict_1.default.equal(correctResult.scoreAwarded, 1);
    // Inverted order
    const wrongResult = (0, index_js_1.gradeOrderingTask)(task, ['item-3', 'item-2', 'item-1']);
    strict_1.default.equal(wrongResult.isCorrect, false);
    strict_1.default.ok(wrongResult.scoreAwarded < 1);
});
//# sourceMappingURL=scoring_and_schemas.test.js.map