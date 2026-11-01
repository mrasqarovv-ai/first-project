export type GameType = 'QUIZ' | 'MATCHING' | 'ORDERING';

export type Language = 'kk' | 'ru';

export type DifficultyLevel = 'A' | 'B' | 'C'; // A - Базалық, B - Қолдану, C - Талдау

export type GameStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type UserRole = 'TEACHER' | 'STUDENT' | 'GUEST';

export type Subject =
  | 'Қазақстан тарихы'
  | 'Дүниежүзі тарихы'
  | 'Биология'
  | 'Физика'
  | 'Химия'
  | 'Математика'
  | 'Алгебра'
  | 'Геометрия'
  | 'Қазақ тілі'
  | 'Қазақ әдебиеті'
  | 'Орыс тілі'
  | 'Ағылшын тілі'
  | 'География'
  | 'Информатика'
  | 'Жаратылыстану';

export interface QuizOption {
  id: string; // Stable UUID or non-index unique string
  text: string;
}

export interface QuizTask {
  id: string;
  orderIndex: number;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  sourceExcerpt: string;
}

export interface MatchingPair {
  id: string; // Unique pair ID
  left: string;
  right: string;
}

export interface MatchingTask {
  id: string;
  orderIndex: number;
  instructions: string;
  pairs: MatchingPair[];
  explanation: string;
  sourceExcerpt: string;
}

export interface OrderItem {
  id: string; // Unique item ID
  text: string;
}

export interface OrderingTask {
  id: string;
  orderIndex: number;
  instructions: string;
  items: OrderItem[];
  correctOrderIds: string[]; // List of item IDs in the correct chronological / logical order
  explanation: string;
  sourceExcerpt: string;
}

export type TaskItem = QuizTask | MatchingTask | OrderingTask;

export interface GameMetadata {
  title: string;
  subject: string;
  grade: number; // 1-11
  language: Language;
  difficulty: DifficultyLevel;
  gameType: GameType;
  itemCount: number; // 5, 10, 15
  timeLimitEnabled: boolean;
  timeLimitSeconds?: number;
}

export interface GameSnapshot {
  schemaVersion: '1.0';
  title: string;
  subject: string;
  grade: number;
  language: Language;
  difficulty: DifficultyLevel;
  gameType: GameType;
  instructions: string;
  items: TaskItem[];
  isDemo?: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
}

export interface GameSummary {
  id: string;
  title: string;
  subject: string;
  grade: number;
  language: Language;
  difficulty: DifficultyLevel;
  gameType: GameType;
  status: GameStatus;
  versionNumber: number;
  pinCode?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

// Student play types (stripped of answers)
export interface StudentQuizTask {
  id: string;
  orderIndex: number;
  question: string;
  options: QuizOption[];
}

export interface StudentMatchingTask {
  id: string;
  orderIndex: number;
  instructions: string;
  leftItems: { id: string; text: string }[];
  rightItems: { id: string; text: string }[];
}

export interface StudentOrderingTask {
  id: string;
  orderIndex: number;
  instructions: string;
  shuffledItems: OrderItem[];
}

export type StudentTask = StudentQuizTask | StudentMatchingTask | StudentOrderingTask;

export interface StudentGameSession {
  pinCode: string;
  gameTitle: string;
  subject: string;
  grade: number;
  language: Language;
  gameType: GameType;
  instructions: string;
  timeLimitSeconds?: number;
  tasks: StudentTask[];
}

export interface TaskGradeResult {
  taskId: string;
  isCorrect: boolean;
  scoreAwarded: number;
  maxScore: number;
  explanation: string;
  sourceExcerpt: string;
  correctDetails: any;
  studentAnswer: any;
}

export interface GameAttemptResult {
  attemptId: string;
  gameTitle: string;
  gameType: GameType;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: string;
  tasks: TaskGradeResult[];
  badge: 'EXCELLENT' | 'GOOD' | 'NEEDS_PRACTICE';
}

export interface TeacherAnalyticsSummary {
  gameId: string;
  gameTitle: string;
  versionNumber: number;
  pinCode?: string;
  totalAttempts: number;
  uniqueParticipants: number;
  averageScorePercentage: number;
  averageTimeSpentSeconds: number;
  difficultTasks: {
    taskId: string;
    prompt: string;
    errorRatePercentage: number;
  }[];
  recentParticipants: {
    attemptId: string;
    studentName: string;
    score: number;
    maxScore: number;
    percentage: number;
    completedAt: string;
  }[];
}
