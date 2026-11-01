"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentAnswersPayloadSchema = exports.GameSnapshotSchema = exports.GeneratedGameSnapshotSchema = exports.OrderingTaskSchema = exports.OrderItemSchema = exports.MatchingTaskSchema = exports.MatchingPairSchema = exports.QuizTaskSchema = exports.QuizOptionSchema = exports.GenerateGameRequestSchema = exports.UserRoleSchema = exports.GameStatusSchema = exports.GameTypeSchema = exports.DifficultyLevelSchema = exports.LanguageSchema = void 0;
exports.validateGeneratedGamePayload = validateGeneratedGamePayload;
const zod_1 = require("zod");
exports.LanguageSchema = zod_1.z.enum(['kk', 'ru']);
exports.DifficultyLevelSchema = zod_1.z.enum(['A', 'B', 'C']);
exports.GameTypeSchema = zod_1.z.enum(['QUIZ', 'MATCHING', 'ORDERING']);
exports.GameStatusSchema = zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
exports.UserRoleSchema = zod_1.z.enum(['TEACHER', 'STUDENT', 'GUEST']);
// AI Generation Request Schema
exports.GenerateGameRequestSchema = zod_1.z.object({
    sourceText: zod_1.z.string().min(20, 'Оқу мәтіні кемінде 20 таңбадан тұруы тиіс').max(20000, 'Мәтін тым ұзын (максимум 20,000 таңба)'),
    subject: zod_1.z.string().min(2, 'Пән атауы көрсетілуі тиіс'),
    topic: zod_1.z.string().optional(),
    grade: zod_1.z.number().int().min(1).max(11),
    language: exports.LanguageSchema,
    difficulty: exports.DifficultyLevelSchema,
    gameType: exports.GameTypeSchema,
    itemCount: zod_1.z.number().int().refine((val) => [3, 5, 10, 15].includes(val), {
        message: 'Тапсырма саны 3, 5, 10 немесе 15 болуы тиіс',
    }),
    timeLimitEnabled: zod_1.z.boolean().default(false),
    timeLimitSeconds: zod_1.z.number().int().min(10).max(600).optional(),
});
// Quiz AI Schemas
exports.QuizOptionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Жауап идентификаторы бос болмауы керек'),
    text: zod_1.z.string().min(1, 'Жауап нұсқасының мәтіні бос болмауы керек'),
});
exports.QuizTaskSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    orderIndex: zod_1.z.number().int().nonnegative(),
    question: zod_1.z.string().min(3, 'Сұрақ мәтіні кемінде 3 таңбадан тұруы тиіс'),
    options: zod_1.z.array(exports.QuizOptionSchema).min(2, 'Кемінде 2 жауап нұсқасы қажет').max(6),
    correctOptionId: zod_1.z.string().min(1),
    explanation: zod_1.z.string().min(3, 'Түсіндірме бос болмауы тиіс'),
    sourceExcerpt: zod_1.z.string().min(1, 'Бастапқы мәтіндегі дәлел үзінді бос болмауы тиіс'),
}).refine((task) => {
    const optionIds = task.options.map(o => o.id);
    // Ensure unique option IDs
    const uniqueIds = new Set(optionIds);
    if (uniqueIds.size !== optionIds.length)
        return false;
    // Ensure correctOptionId points to an existing option
    return optionIds.includes(task.correctOptionId);
}, {
    message: 'Дұрыс жауап ID нұсқалар тізімінде болуы және барлық нұсқалардың ID-лері қайталанбауы тиіс',
});
// Matching AI Schemas
exports.MatchingPairSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    left: zod_1.z.string().min(1, 'Сол жақ баған бос болмауы керек'),
    right: zod_1.z.string().min(1, 'Оң жақ баған бос болмауы керек'),
});
exports.MatchingTaskSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    orderIndex: zod_1.z.number().int().nonnegative(),
    instructions: zod_1.z.string().min(3),
    pairs: zod_1.z.array(exports.MatchingPairSchema).min(3, 'Сәйкестендіру тапсырмасында кемінде 3 жұп болуы тиіс').max(10),
    explanation: zod_1.z.string().min(3),
    sourceExcerpt: zod_1.z.string().min(1),
}).refine((task) => {
    const pairIds = task.pairs.map(p => p.id);
    const uniqueIds = new Set(pairIds);
    return uniqueIds.size === pairIds.length;
}, {
    message: 'Сәйкестендіру жұптарының ID-лері бірегей болуы тиіс',
});
// Ordering AI Schemas
exports.OrderItemSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    text: zod_1.z.string().min(1, 'Реттелетін элемент мәтіні бос болмауы керек'),
});
exports.OrderingTaskSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    orderIndex: zod_1.z.number().int().nonnegative(),
    instructions: zod_1.z.string().min(3),
    items: zod_1.z.array(exports.OrderItemSchema).min(3, 'Ретке орналастыруда кемінде 3 элемент болуы керек').max(10),
    correctOrderIds: zod_1.z.array(zod_1.z.string().min(1)),
    explanation: zod_1.z.string().min(3),
    sourceExcerpt: zod_1.z.string().min(1),
}).refine((task) => {
    const itemIds = task.items.map(i => i.id);
    const uniqueItemIds = new Set(itemIds);
    if (uniqueItemIds.size !== itemIds.length)
        return false;
    const correctIds = task.correctOrderIds;
    if (correctIds.length !== itemIds.length)
        return false;
    const uniqueCorrectIds = new Set(correctIds);
    if (uniqueCorrectIds.size !== correctIds.length)
        return false;
    // Each item ID must be present in correctOrderIds
    return itemIds.every(id => uniqueCorrectIds.has(id));
}, {
    message: 'Дұрыс реттегі ID тізімі барлық элементтерді толық әрі қайталанбай қамтуы тиіс',
});
// Full Generated Game Snapshot Schema
exports.GeneratedGameSnapshotSchema = zod_1.z.object({
    schemaVersion: zod_1.z.literal('1.0'),
    title: zod_1.z.string().min(2, 'Ойын тақырыбы бос болмауы керек'),
    subject: zod_1.z.string().min(2),
    grade: zod_1.z.number().int().min(1).max(11),
    language: exports.LanguageSchema,
    difficulty: exports.DifficultyLevelSchema,
    gameType: exports.GameTypeSchema,
    instructions: zod_1.z.string().min(3),
    items: zod_1.z.array(zod_1.z.union([exports.QuizTaskSchema, exports.MatchingTaskSchema, exports.OrderingTaskSchema])).min(1),
    isDemo: zod_1.z.boolean().optional(),
});
exports.GameSnapshotSchema = exports.GeneratedGameSnapshotSchema;
exports.StudentAnswersPayloadSchema = zod_1.z.object({
    studentName: zod_1.z.string().min(1).max(60).optional(),
    timeSpentSeconds: zod_1.z.number().int().min(0).default(0),
    answers: zod_1.z.record(zod_1.z.any()), // Map of taskId -> student answer (string for Quiz, object for Matching, array for Ordering)
});
// Detailed validator helper function with human-readable error messages
function validateGeneratedGamePayload(payload, expectedGameType, expectedCount) {
    const errors = [];
    if (!payload || typeof payload !== 'object') {
        return { success: false, errors: ['ЖИ жауабы JSON нысаны емес'] };
    }
    const raw = payload;
    if (raw.schemaVersion !== '1.0') {
        errors.push('schemaVersion өрісі "1.0" болуы тиіс');
    }
    if (!raw.title || typeof raw.title !== 'string' || raw.title.trim().length === 0) {
        errors.push('title өрісі бос болмауы керек');
    }
    if (raw.gameType !== expectedGameType) {
        errors.push(`Ойын түрі күтілген "${expectedGameType}" түріне сәйкес келмейді: "${raw.gameType}"`);
    }
    if (!Array.isArray(raw.items) || raw.items.length === 0) {
        errors.push('items массиві кемінде бір тапсырманы қамтуы қажет');
        return { success: false, errors };
    }
    if (expectedCount && raw.items.length < Math.min(expectedCount, 3)) {
        errors.push(`Тапсырма саны жеткіліксіз (сұралды: ${expectedCount}, алынды: ${raw.items.length})`);
    }
    const taskIds = new Set();
    for (let i = 0; i < raw.items.length; i++) {
        const item = raw.items[i];
        const prefix = `Тапсырма #${i + 1}`;
        if (!item.id || typeof item.id !== 'string') {
            errors.push(`${prefix}: ID өрісі жоқ немесе жарамсыз`);
        }
        else if (taskIds.has(item.id)) {
            errors.push(`${prefix}: Қайталанатын тапсырма ID "${item.id}"`);
        }
        else {
            taskIds.add(item.id);
        }
        if (!item.explanation || typeof item.explanation !== 'string' || item.explanation.trim().length === 0) {
            errors.push(`${prefix}: Түсіндірме (explanation) бос қалған`);
        }
        if (!item.sourceExcerpt || typeof item.sourceExcerpt !== 'string' || item.sourceExcerpt.trim().length === 0) {
            errors.push(`${prefix}: Дәлел үзінді (sourceExcerpt) бос қалған`);
        }
        if (expectedGameType === 'QUIZ') {
            const parsed = exports.QuizTaskSchema.safeParse(item);
            if (!parsed.success) {
                errors.push(`${prefix} (Викторина): ${parsed.error.errors.map(e => e.message).join(', ')}`);
            }
        }
        else if (expectedGameType === 'MATCHING') {
            const parsed = exports.MatchingTaskSchema.safeParse(item);
            if (!parsed.success) {
                errors.push(`${prefix} (Сәйкестендіру): ${parsed.error.errors.map(e => e.message).join(', ')}`);
            }
        }
        else if (expectedGameType === 'ORDERING') {
            const parsed = exports.OrderingTaskSchema.safeParse(item);
            if (!parsed.success) {
                errors.push(`${prefix} (Ретке орналастыру): ${parsed.error.errors.map(e => e.message).join(', ')}`);
            }
        }
    }
    if (errors.length > 0) {
        return { success: false, errors };
    }
    const finalParsed = exports.GeneratedGameSnapshotSchema.safeParse(payload);
    if (!finalParsed.success) {
        return {
            success: false,
            errors: finalParsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        };
    }
    return { success: true, errors: [], data: finalParsed.data };
}
//# sourceMappingURL=schemas.js.map