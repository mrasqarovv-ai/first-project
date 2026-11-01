import {
  GameSnapshot,
  GenerateGameRequest,
  GameSummary,
  StudentGameSession,
  GameAttemptResult,
  TeacherAnalyticsSummary,
  prepareStudentSession,
  gradeGameAttempt,
  DEMO_QUIZ_KK,
  DEMO_MATCHING_KK,
  DEMO_ORDERING_KK,
} from '@oquplay/shared';

// Default backend API URL
const getBaseApiUrl = () => {
  try {
    const custom = localStorage.getItem('oquplay_api_url');
    if (custom) return custom;
  } catch {}
  return 'http://localhost:4000/api';
};

// Local in-memory / localStorage fallback storage
interface MockStore {
  games: any[];
  attempts: any[];
}

function getLocalStore(): MockStore {
  try {
    const raw = localStorage.getItem('oquplay_mock_store');
    if (raw) return JSON.parse(raw);
  } catch {}

  // Initial seed
  const initial: MockStore = {
    games: [
      {
        id: 'mock-g1',
        ownerId: 'teacher-1',
        title: DEMO_QUIZ_KK.title,
        subject: DEMO_QUIZ_KK.subject,
        grade: DEMO_QUIZ_KK.grade,
        language: DEMO_QUIZ_KK.language,
        difficulty: DEMO_QUIZ_KK.difficulty,
        gameType: DEMO_QUIZ_KK.gameType,
        status: 'PUBLISHED',
        versionNumber: 1,
        pinCode: '718293',
        itemCount: DEMO_QUIZ_KK.items.length,
        snapshot: DEMO_QUIZ_KK,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mock-g2',
        ownerId: 'teacher-1',
        title: DEMO_MATCHING_KK.title,
        subject: DEMO_MATCHING_KK.subject,
        grade: DEMO_MATCHING_KK.grade,
        language: DEMO_MATCHING_KK.language,
        difficulty: DEMO_MATCHING_KK.difficulty,
        gameType: DEMO_MATCHING_KK.gameType,
        status: 'PUBLISHED',
        versionNumber: 1,
        pinCode: '452819',
        itemCount: DEMO_MATCHING_KK.items.length,
        snapshot: DEMO_MATCHING_KK,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mock-g3',
        ownerId: 'teacher-1',
        title: DEMO_ORDERING_KK.title,
        subject: DEMO_ORDERING_KK.subject,
        grade: DEMO_ORDERING_KK.grade,
        language: DEMO_ORDERING_KK.language,
        difficulty: DEMO_ORDERING_KK.difficulty,
        gameType: DEMO_ORDERING_KK.gameType,
        status: 'DRAFT',
        versionNumber: 1,
        itemCount: DEMO_ORDERING_KK.items.length,
        snapshot: DEMO_ORDERING_KK,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    attempts: [
      {
        attemptId: 'att-1',
        gameId: 'mock-g1',
        pinCode: '718293',
        userId: 'student-1',
        studentName: 'Әлихан Оқушы',
        score: 5,
        maxScore: 5,
        percentage: 100,
        timeSpentSeconds: 42,
        badge: 'EXCELLENT',
        completedAt: new Date(Date.now() - 3600000).toISOString(),
        answers: {},
      },
      {
        attemptId: 'att-2',
        gameId: 'mock-g1',
        pinCode: '718293',
        userId: null,
        studentName: 'Нұрсұлтан (қонақ)',
        score: 4,
        maxScore: 5,
        percentage: 80,
        timeSpentSeconds: 58,
        badge: 'GOOD',
        completedAt: new Date(Date.now() - 7200000).toISOString(),
        answers: {},
      },
    ],
  };

  saveLocalStore(initial);
  return initial;
}

function saveLocalStore(store: MockStore) {
  try {
    localStorage.setItem('oquplay_mock_store', JSON.stringify(store));
  } catch {}
}

export const api = {
  // Check backend availability
  async checkBackend(): Promise<boolean> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/health`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Auth: Login
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    // Fallback authentication
    if (email.includes('teacher') || email === 'teacher@oquplay.kz') {
      return {
        token: 'mock-teacher-token',
        user: { id: 'teacher-1', email, name: 'Айгүл Мұғалім', role: 'TEACHER' },
      };
    }
    return {
      token: 'mock-student-token',
      user: { id: 'student-1', email, name: 'Әлихан Оқушы', role: 'STUDENT' },
    };
  },

  // Auth: Register
  async register(data: { email: string; password: string; name: string; role: string }): Promise<{ token: string; user: any }> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    return {
      token: `mock-user-${Date.now()}`,
      user: { id: `u-${Date.now()}`, email: data.email, name: data.name, role: data.role },
    };
  },

  // AI Game Generation
  async generateGame(req: GenerateGameRequest, token?: string): Promise<{ snapshot: GameSnapshot; isDemo: boolean }> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/games/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        return { snapshot: data.snapshot, isDemo: data.isDemo };
      }
    } catch {}

    // In-browser pedagogical AI generator fallback
    let baseDemo: GameSnapshot = DEMO_QUIZ_KK;
    if (req.gameType === 'MATCHING') baseDemo = DEMO_MATCHING_KK;
    if (req.gameType === 'ORDERING') baseDemo = DEMO_ORDERING_KK;

    const sliceCount = req.itemCount || 5;
    const items = [...baseDemo.items].slice(0, sliceCount);

    return {
      snapshot: {
        ...baseDemo,
        title: req.topic ? `${req.subject}: ${req.topic}` : `${req.subject} бойынша жаттығу`,
        subject: req.subject,
        grade: req.grade,
        language: req.language,
        difficulty: req.difficulty,
        items,
        isDemo: true,
      },
      isDemo: true,
    };
  },

  // List games for current user
  async getMyGames(token?: string, filters?: { status?: string; subject?: string; gameType?: string; search?: string }): Promise<GameSummary[]> {
    try {
      const q = new URLSearchParams(filters as any).toString();
      const res = await fetch(`${getBaseApiUrl()}/games?${q}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    return store.games.map((g) => ({
      id: g.id,
      title: g.title,
      subject: g.subject,
      grade: g.grade,
      language: g.language,
      difficulty: g.difficulty,
      gameType: g.gameType,
      status: g.status,
      versionNumber: g.versionNumber,
      pinCode: g.pinCode,
      itemCount: g.itemCount,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
  },

  // Get single game with snapshot
  async getGame(id: string, token?: string): Promise<any> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/games/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    return store.games.find((g) => g.id === id) || null;
  },

  // Save new game
  async saveGame(snapshot: GameSnapshot, status: 'DRAFT' | 'PUBLISHED', token?: string): Promise<any> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ snapshot, status }),
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    const pinCode = status === 'PUBLISHED' ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;
    const newGame = {
      id: `local-g-${Date.now()}`,
      ownerId: 'teacher-1',
      title: snapshot.title,
      subject: snapshot.subject,
      grade: snapshot.grade,
      language: snapshot.language,
      difficulty: snapshot.difficulty,
      gameType: snapshot.gameType,
      status,
      versionNumber: 1,
      pinCode,
      itemCount: snapshot.items.length,
      snapshot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.games.unshift(newGame);
    saveLocalStore(store);
    return newGame;
  },

  // Update existing game
  async updateGame(id: string, snapshot: GameSnapshot, token?: string): Promise<any> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/games/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ snapshot }),
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    const game = store.games.find((g) => g.id === id);
    if (game) {
      if (game.status === 'PUBLISHED') {
        game.versionNumber += 1;
      }
      game.title = snapshot.title;
      game.subject = snapshot.subject;
      game.snapshot = snapshot;
      game.updatedAt = new Date().toISOString();
      saveLocalStore(store);
    }
    return game;
  },

  // Publish game
  async publishGame(id: string, token?: string): Promise<{ pinCode: string }> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/games/${id}/publish`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    const game = store.games.find((g) => g.id === id);
    const pin = game?.pinCode || Math.floor(100000 + Math.random() * 900000).toString();
    if (game) {
      game.status = 'PUBLISHED';
      game.pinCode = pin;
      saveLocalStore(store);
    }
    return { pinCode: pin };
  },

  // Archive / Unpublish game
  async archiveGame(id: string, token?: string): Promise<any> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/games/${id}/archive`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    const game = store.games.find((g) => g.id === id);
    if (game) {
      game.status = 'ARCHIVED';
      game.pinCode = undefined;
      saveLocalStore(store);
    }
    return { status: 'ARCHIVED' };
  },

  // Duplicate game
  async duplicateGame(id: string, token?: string): Promise<any> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/games/${id}/duplicate`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    const game = store.games.find((g) => g.id === id);
    if (!game) throw new Error('Ойын табылмады');

    const copy = {
      ...game,
      id: `copy-${Date.now()}`,
      title: `${game.title} (Көшірме)`,
      status: 'DRAFT',
      pinCode: undefined,
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.games.unshift(copy);
    saveLocalStore(store);
    return copy;
  },

  // Play: Join session by PIN
  async joinSession(pinCode: string): Promise<{ session: StudentGameSession; isDemo: boolean }> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/play/join/${pinCode}`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    const game = store.games.find((g) => g.pinCode === pinCode && g.status === 'PUBLISHED');
    if (!game) throw new Error('Бұл кодпен ойын табылмады немесе жабылған');

    const session = prepareStudentSession(game.snapshot, pinCode);
    return { session, isDemo: Boolean(game.snapshot.isDemo) };
  },

  // Play: Submit answers
  async submitAnswers(
    pinCode: string,
    answers: Record<string, any>,
    timeSpentSeconds: number,
    studentName?: string,
    token?: string
  ): Promise<GameAttemptResult> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/play/submit/${pinCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers, timeSpentSeconds, studentName }),
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    const game = store.games.find((g) => g.pinCode === pinCode);
    if (!game) throw new Error('Ойын табылмады');

    const gradeResult = gradeGameAttempt(game.snapshot, answers, timeSpentSeconds, pinCode);

    // Record attempt locally
    store.attempts.push({
      attemptId: gradeResult.attemptId,
      gameId: game.id,
      pinCode,
      studentName: studentName || 'Қонақ',
      score: gradeResult.score,
      maxScore: gradeResult.maxScore,
      percentage: gradeResult.percentage,
      timeSpentSeconds,
      badge: gradeResult.badge,
      completedAt: gradeResult.completedAt,
    });
    saveLocalStore(store);

    return gradeResult;
  },

  // Teacher Analytics
  async getTeacherAnalytics(gameId: string, token?: string): Promise<TeacherAnalyticsSummary> {
    try {
      const res = await fetch(`${getBaseApiUrl()}/teacher/games/${gameId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    const game = store.games.find((g) => g.id === gameId);
    const gameAttempts = store.attempts.filter((a) => a.gameId === gameId || a.pinCode === game?.pinCode);

    const totalAttempts = gameAttempts.length;
    const participantNames = new Set(gameAttempts.map((a) => a.studentName));
    const uniqueParticipants = participantNames.size;

    const avgScore = totalAttempts > 0
      ? Math.round(gameAttempts.reduce((s, a) => s + a.percentage, 0) / totalAttempts)
      : 0;

    const avgTime = totalAttempts > 0
      ? Math.round(gameAttempts.reduce((s, a) => s + a.timeSpentSeconds, 0) / totalAttempts)
      : 0;

    return {
      gameId,
      gameTitle: game?.title || 'Ойын',
      versionNumber: game?.versionNumber || 1,
      pinCode: game?.pinCode,
      totalAttempts,
      uniqueParticipants,
      averageScorePercentage: avgScore,
      averageTimeSpentSeconds: avgTime,
      difficultTasks: [
        { taskId: 'demo-q2', prompt: 'Қазақ хандығы алғаш құрылған тарихи аймақ', errorRatePercentage: 40 },
        { taskId: 'demo-q4', prompt: '«Жеті жарғы» заңдар кодексі', errorRatePercentage: 25 },
      ],
      recentParticipants: gameAttempts.map((a) => ({
        attemptId: a.attemptId,
        studentName: a.studentName,
        score: a.score,
        maxScore: a.maxScore,
        percentage: a.percentage,
        completedAt: a.completedAt,
      })),
    };
  },
};
