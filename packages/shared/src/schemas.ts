import { z } from 'zod';

export const LanguageSchema = z.enum(['kk', 'ru']);
export const DifficultyLevelSchema = z.enum(['A', 'B', 'C']);
export const GameTypeSchema = z.enum(['QUIZ', 'MATCHING', 'ORDERING']);
export const GameStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const UserRoleSchema = z.enum(['TEACHER', 'STUDENT', 'GUEST']);

// AI Generation Request Schema
export const GenerateGameRequestSchema = z.object({
  sourceText: z.string().min(20, 'Оқу мәтіні кемінде 20 таңбадан тұруы тиіс').max(20000, 'Мәтін тым ұзын (максимум 20,000 таңба)'),
  subject: z.string().min(2, 'Пән атауы көрсетілуі тиіс'),
  topic: z.string().optional(),
  grade: z.number().int().min(1).max(11),
  language: LanguageSchema,
  difficulty: DifficultyLevelSchema,
  gameType: GameTypeSchema,
  itemCount: z.number().int().refine((val) => [3, 5, 10, 15].includes(val), {
    message: 'Тапсырма саны 3, 5, 10 немесе 15 болуы тиіс',
  }),
  timeLimitEnabled: z.boolean().default(false),
  timeLimitSeconds: z.number().int().min(10).max(600).optional(),
});

export type GenerateGameRequest = z.infer<typeof GenerateGameRequestSchema>;

// Quiz AI Schemas
export const QuizOptionSchema = z.object({
  id: z.string().min(1, 'Жауап идентификаторы бос болмауы керек'),
  text: z.string().min(1, 'Жауап нұсқасының мәтіні бос болмауы керек'),
});

export const QuizTaskSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  question: z.string().min(3, 'Сұрақ мәтіні кемінде 3 таңбадан тұруы тиіс'),
  options: z.array(QuizOptionSchema).min(2, 'Кемінде 2 жауап нұсқасы қажет').max(6),
  correctOptionId: z.string().min(1),
  explanation: z.string().min(3, 'Түсіндірме бос болмауы тиіс'),
  sourceExcerpt: z.string().min(1, 'Бастапқы мәтіндегі дәлел үзінді бос болмауы тиіс'),
}).refine((task) => {
  const optionIds = task.options.map(o => o.id);
  // Ensure unique option IDs
  const uniqueIds = new Set(optionIds);
  if (uniqueIds.size !== optionIds.length) return false;
  // Ensure correctOptionId points to an existing option
  return optionIds.includes(task.correctOptionId);
}, {
  message: 'Дұрыс жауап ID нұсқалар тізімінде болуы және барлық нұсқалардың ID-лері қайталанбауы тиіс',
});

// Matching AI Schemas
export const MatchingPairSchema = z.object({
  id: z.string().min(1),
  left: z.string().min(1, 'Сол жақ баған бос болмауы керек'),
  right: z.string().min(1, 'Оң жақ баған бос болмауы керек'),
});

export const MatchingTaskSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  instructions: z.string().min(3),
  pairs: z.array(MatchingPairSchema).min(3, 'Сәйкестендіру тапсырмасында кемінде 3 жұп болуы тиіс').max(10),
  explanation: z.string().min(3),
  sourceExcerpt: z.string().min(1),
}).refine((task) => {
  const pairIds = task.pairs.map(p => p.id);
  const uniqueIds = new Set(pairIds);
  return uniqueIds.size === pairIds.length;
}, {
  message: 'Сәйкестендіру жұптарының ID-лері бірегей болуы тиіс',
});

// Ordering AI Schemas
export const OrderItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, 'Реттелетін элемент мәтіні бос болмауы керек'),
});

export const OrderingTaskSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  instructions: z.string().min(3),
  items: z.array(OrderItemSchema).min(3, 'Ретке орналастыруда кемінде 3 элемент болуы керек').max(10),
  correctOrderIds: z.array(z.string().min(1)),
  explanation: z.string().min(3),
  sourceExcerpt: z.string().min(1),
}).refine((task) => {
  const itemIds = task.items.map(i => i.id);
  const uniqueItemIds = new Set(itemIds);
  if (uniqueItemIds.size !== itemIds.length) return false;

  const correctIds = task.correctOrderIds;
  if (correctIds.length !== itemIds.length) return false;

  const uniqueCorrectIds = new Set(correctIds);
  if (uniqueCorrectIds.size !== correctIds.length) return false;

  // Each item ID must be present in correctOrderIds
  return itemIds.every(id => uniqueCorrectIds.has(id));
}, {
  message: 'Дұрыс реттегі ID тізімі барлық элементтерді толық әрі қайталанбай қамтуы тиіс',
});

// Full Generated Game Snapshot Schema
export const GeneratedGameSnapshotSchema = z.object({
  schemaVersion: z.literal('1.0'),
  title: z.string().min(2, 'Ойын тақырыбы бос болмауы керек'),
  subject: z.string().min(2),
  grade: z.number().int().min(1).max(11),
  language: LanguageSchema,
  difficulty: DifficultyLevelSchema,
  gameType: GameTypeSchema,
  instructions: z.string().min(3),
  items: z.array(z.union([QuizTaskSchema, MatchingTaskSchema, OrderingTaskSchema])).min(1),
  isDemo: z.boolean().optional(),
});

export type GeneratedGameSnapshot = z.infer<typeof GeneratedGameSnapshotSchema>;
export const GameSnapshotSchema = GeneratedGameSnapshotSchema;

export const StudentAnswersPayloadSchema = z.object({
  studentName: z.string().min(1).max(60).optional(),
  timeSpentSeconds: z.number().int().min(0).default(0),
  answers: z.record(z.any()), // Map of taskId -> student answer (string for Quiz, object for Matching, array for Ordering)
});
export type StudentAnswersPayload = z.infer<typeof StudentAnswersPayloadSchema>;


// Detailed validator helper function with human-readable error messages
export function validateGeneratedGamePayload(
  payload: unknown,
  expectedGameType: string,
  expectedCount?: number
): { success: boolean; errors: string[]; data?: GeneratedGameSnapshot } {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { success: false, errors: ['ЖИ жауабы JSON нысаны емес'] };
  }

  const raw = payload as any;

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

  const taskIds = new Set<string>();

  for (let i = 0; i < raw.items.length; i++) {
    const item = raw.items[i];
    const prefix = `Тапсырма #${i + 1}`;

    if (!item.id || typeof item.id !== 'string') {
      errors.push(`${prefix}: ID өрісі жоқ немесе жарамсыз`);
    } else if (taskIds.has(item.id)) {
      errors.push(`${prefix}: Қайталанатын тапсырма ID "${item.id}"`);
    } else {
      taskIds.add(item.id);
    }

    if (!item.explanation || typeof item.explanation !== 'string' || item.explanation.trim().length === 0) {
      errors.push(`${prefix}: Түсіндірме (explanation) бос қалған`);
    }

    if (!item.sourceExcerpt || typeof item.sourceExcerpt !== 'string' || item.sourceExcerpt.trim().length === 0) {
      errors.push(`${prefix}: Дәлел үзінді (sourceExcerpt) бос қалған`);
    }

    if (expectedGameType === 'QUIZ') {
      const parsed = QuizTaskSchema.safeParse(item);
      if (!parsed.success) {
        errors.push(`${prefix} (Викторина): ${parsed.error.errors.map(e => e.message).join(', ')}`);
      }
    } else if (expectedGameType === 'MATCHING') {
      const parsed = MatchingTaskSchema.safeParse(item);
      if (!parsed.success) {
        errors.push(`${prefix} (Сәйкестендіру): ${parsed.error.errors.map(e => e.message).join(', ')}`);
      }
    } else if (expectedGameType === 'ORDERING') {
      const parsed = OrderingTaskSchema.safeParse(item);
      if (!parsed.success) {
        errors.push(`${prefix} (Ретке орналастыру): ${parsed.error.errors.map(e => e.message).join(', ')}`);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const finalParsed = GeneratedGameSnapshotSchema.safeParse(payload);
  if (!finalParsed.success) {
    return {
      success: false,
      errors: finalParsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return { success: true, errors: [], data: finalParsed.data };
}
