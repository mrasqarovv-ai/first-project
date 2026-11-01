import { QuizTask, MatchingTask, OrderingTask, GameSnapshot, StudentGameSession, TaskGradeResult, GameAttemptResult } from './types.js';
/**
 * Deterministic or random array shuffle (Fisher-Yates)
 */
export declare function shuffleArray<T>(array: readonly T[], seed?: number): T[];
/**
 * Prepares a game session for a student by shuffling choices and STRIPPING all answer keys,
 * explanations, and source evidence. The student NEVER receives answer keys!
 */
export declare function prepareStudentSession(game: GameSnapshot, pinCode: string): StudentGameSession;
/**
 * Grades a single Quiz task
 */
export declare function gradeQuizTask(task: QuizTask, studentAnswer: string): TaskGradeResult;
/**
 * Grades a Matching task
 * Student answer format: Record<string, string> where key = pairId / leftItemId, value = matched rightItemId
 */
export declare function gradeMatchingTask(task: MatchingTask, studentPairs: Record<string, string>): TaskGradeResult;
/**
 * Grades an Ordering task
 * Student answer format: string[] list of item IDs in chosen order
 * Scoring rule:
 * 1. Absolute position match: percentage of items placed at the exact correct index
 * 2. Perfect order gives 1 full point
 */
export declare function gradeOrderingTask(task: OrderingTask, studentOrderIds: string[]): TaskGradeResult;
/**
 * Evaluates a complete game attempt on the server
 */
export declare function gradeCompleteGameAttempt(game: GameSnapshot, studentAnswers: Record<string, any>, timeSpentSeconds: number, attemptId: string): GameAttemptResult;
//# sourceMappingURL=scoring.d.ts.map