import {
  QuizTask,
  MatchingTask,
  OrderingTask,
  TaskItem,
  GameSnapshot,
  StudentGameSession,
  StudentQuizTask,
  StudentMatchingTask,
  StudentOrderingTask,
  TaskGradeResult,
  GameAttemptResult,
} from './types.js';

/**
 * Deterministic or random array shuffle (Fisher-Yates)
 */
export function shuffleArray<T>(array: readonly T[], seed?: number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = seed !== undefined 
      ? Math.floor(((Math.sin(seed + i) * 10000) % 1 + 1) % 1 * (i + 1))
      : Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Prepares a game session for a student by shuffling choices and STRIPPING all answer keys,
 * explanations, and source evidence. The student NEVER receives answer keys!
 */
export function prepareStudentSession(game: GameSnapshot, pinCode: string): StudentGameSession {
  const studentTasks = game.items.map((item, index) => {
    if (game.gameType === 'QUIZ') {
      const q = item as QuizTask;
      return {
        id: q.id,
        orderIndex: index,
        question: q.question,
        options: shuffleArray(q.options),
      } as StudentQuizTask;
    }

    if (game.gameType === 'MATCHING') {
      const m = item as MatchingTask;
      const leftItems = m.pairs.map(p => ({ id: p.id, text: p.left }));
      const rightItems = shuffleArray(m.pairs.map(p => ({ id: p.id, text: p.right })));
      return {
        id: m.id,
        orderIndex: index,
        instructions: m.instructions || 'Сәйкес жұптарды байланыстырыңыз',
        leftItems: shuffleArray(leftItems),
        rightItems: rightItems,
      } as StudentMatchingTask;
    }

    // ORDERING
    const o = item as OrderingTask;
    return {
      id: o.id,
      orderIndex: index,
      instructions: o.instructions || 'Элементтерді дұрыс ретімен орналастырыңыз',
      shuffledItems: shuffleArray(o.items),
    } as StudentOrderingTask;
  });

  return {
    pinCode,
    gameTitle: game.title,
    subject: game.subject,
    grade: game.grade,
    language: game.language,
    gameType: game.gameType,
    instructions: game.instructions,
    tasks: studentTasks,
  };
}

/**
 * Grades a single Quiz task
 */
export function gradeQuizTask(task: QuizTask, studentAnswer: string): TaskGradeResult {
  const isCorrect = studentAnswer === task.correctOptionId;
  const correctOption = task.options.find(o => o.id === task.correctOptionId);

  return {
    taskId: task.id,
    isCorrect,
    scoreAwarded: isCorrect ? 1 : 0,
    maxScore: 1,
    explanation: task.explanation,
    sourceExcerpt: task.sourceExcerpt,
    correctDetails: {
      correctOptionId: task.correctOptionId,
      correctText: correctOption?.text || '',
    },
    studentAnswer: {
      selectedOptionId: studentAnswer,
      selectedText: task.options.find(o => o.id === studentAnswer)?.text || '',
    },
  };
}

/**
 * Grades a Matching task
 * Student answer format: Record<string, string> where key = pairId / leftItemId, value = matched rightItemId
 */
export function gradeMatchingTask(task: MatchingTask, studentPairs: Record<string, string>): TaskGradeResult {
  const totalPairs = task.pairs.length;
  if (totalPairs === 0) {
    return {
      taskId: task.id,
      isCorrect: true,
      scoreAwarded: 1,
      maxScore: 1,
      explanation: task.explanation,
      sourceExcerpt: task.sourceExcerpt,
      correctDetails: task.pairs,
      studentAnswer: studentPairs,
    };
  }

  let correctMatchesCount = 0;
  for (const pair of task.pairs) {
    // Correct if the student linked this pair's left item (pair.id) with its own right item (pair.id)
    if (studentPairs && studentPairs[pair.id] === pair.id) {
      correctMatchesCount++;
    }
  }

  const scoreAwarded = Math.round((correctMatchesCount / totalPairs) * 100) / 100;
  const isCorrect = correctMatchesCount === totalPairs;

  return {
    taskId: task.id,
    isCorrect,
    scoreAwarded,
    maxScore: 1,
    explanation: task.explanation,
    sourceExcerpt: task.sourceExcerpt,
    correctDetails: {
      pairs: task.pairs.map(p => ({ id: p.id, left: p.left, right: p.right })),
      totalPairs,
    },
    studentAnswer: {
      matchedPairs: studentPairs || {},
      correctCount: correctMatchesCount,
    },
  };
}

/**
 * Grades an Ordering task
 * Student answer format: string[] list of item IDs in chosen order
 * Scoring rule:
 * 1. Absolute position match: percentage of items placed at the exact correct index
 * 2. Perfect order gives 1 full point
 */
export function gradeOrderingTask(task: OrderingTask, studentOrderIds: string[]): TaskGradeResult {
  const correctOrder = task.correctOrderIds;
  const totalItems = correctOrder.length;

  if (totalItems === 0) {
    return {
      taskId: task.id,
      isCorrect: true,
      scoreAwarded: 1,
      maxScore: 1,
      explanation: task.explanation,
      sourceExcerpt: task.sourceExcerpt,
      correctDetails: task.correctOrderIds,
      studentAnswer: studentOrderIds,
    };
  }

  let correctPositions = 0;
  if (Array.isArray(studentOrderIds)) {
    for (let i = 0; i < totalItems; i++) {
      if (studentOrderIds[i] === correctOrder[i]) {
        correctPositions++;
      }
    }
  }

  const scoreAwarded = Math.round((correctPositions / totalItems) * 100) / 100;
  const isCorrect = correctPositions === totalItems;

  const itemMap = new Map(task.items.map(i => [i.id, i.text]));

  return {
    taskId: task.id,
    isCorrect,
    scoreAwarded,
    maxScore: 1,
    explanation: task.explanation,
    sourceExcerpt: task.sourceExcerpt,
    correctDetails: {
      orderedList: correctOrder.map(id => ({ id, text: itemMap.get(id) || '' })),
    },
    studentAnswer: {
      orderedList: (studentOrderIds || []).map(id => ({ id, text: itemMap.get(id) || '' })),
      correctPositions,
    },
  };
}

/**
 * Evaluates a complete game attempt on the server
 */
export function gradeCompleteGameAttempt(
  game: GameSnapshot,
  studentAnswers: Record<string, any>,
  timeSpentSeconds: number,
  attemptId: string
): GameAttemptResult {
  const taskResults: TaskGradeResult[] = [];
  let totalScore = 0;
  const maxScore = game.items.length;

  for (const item of game.items) {
    const studentAns = studentAnswers ? studentAnswers[item.id] : undefined;

    if (game.gameType === 'QUIZ') {
      const res = gradeQuizTask(item as QuizTask, studentAns);
      taskResults.push(res);
      totalScore += res.scoreAwarded;
    } else if (game.gameType === 'MATCHING') {
      const res = gradeMatchingTask(item as MatchingTask, studentAns);
      taskResults.push(res);
      totalScore += res.scoreAwarded;
    } else if (game.gameType === 'ORDERING') {
      const res = gradeOrderingTask(item as OrderingTask, studentAns);
      taskResults.push(res);
      totalScore += res.scoreAwarded;
    }
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  let badge: 'EXCELLENT' | 'GOOD' | 'NEEDS_PRACTICE' = 'NEEDS_PRACTICE';
  if (percentage >= 85) {
    badge = 'EXCELLENT';
  } else if (percentage >= 60) {
    badge = 'GOOD';
  }

  return {
    attemptId,
    gameTitle: game.title,
    gameType: game.gameType,
    score: Math.round(totalScore * 100) / 100,
    maxScore,
    percentage,
    timeSpentSeconds,
    completedAt: new Date().toISOString(),
    tasks: taskResults,
    badge,
  };
}
