import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { authenticateToken } from '../auth.js';
import { GameSnapshot } from '@oquplay/shared';

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Teacher Analytics for a specific game
  fastify.get('/teacher/games/:gameId', { preHandler: [authenticateToken] }, async (request, reply) => {
    const { gameId } = request.params as { gameId: string };
    const userId = request.authUser!.id;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            shareSessions: {
              include: {
                attempts: {
                  orderBy: { completedAt: 'desc' },
                  include: {
                    user: true,
                    answers: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!game) {
      return reply.status(404).send({ error: 'Ойын табылмады' });
    }

    if (game.ownerId !== userId) {
      return reply.status(403).send({ error: 'Бұл нәтижелерді көруге рұқсатыңыз жоқ' });
    }

    const latestVersion = game.versions[0];
    let snapshot: GameSnapshot | null = null;
    if (latestVersion) {
      try {
        snapshot = JSON.parse(latestVersion.snapshotJson);
      } catch {}
    }

    // Aggregate attempts across all sessions of this game
    const allAttempts: any[] = [];
    let activePinCode: string | undefined;

    for (const v of game.versions) {
      for (const s of v.shareSessions) {
        if (s.isActive && !activePinCode) {
          activePinCode = s.pinCode;
        }
        allAttempts.push(...s.attempts);
      }
    }

    const totalAttempts = allAttempts.length;

    // Separate unique participants vs repeat attempts
    // Map by participant identifier: userId if logged in, or lowercased guestName
    const participantMap = new Map<string, any[]>();
    for (const att of allAttempts) {
      const participantKey = att.userId || att.guestName?.toLowerCase() || 'белгісіз';
      if (!participantMap.has(participantKey)) {
        participantMap.set(participantKey, []);
      }
      participantMap.get(participantKey)!.push(att);
    }

    const uniqueParticipants = participantMap.size;

    // Average score & average time spent
    let totalScoreSum = 0;
    let totalTimeSum = 0;
    for (const att of allAttempts) {
      totalScoreSum += att.percentage;
      totalTimeSum += att.timeSpentSeconds;
    }

    const averageScorePercentage = totalAttempts > 0 ? Math.round(totalScoreSum / totalAttempts) : 0;
    const averageTimeSpentSeconds = totalAttempts > 0 ? Math.round(totalTimeSum / totalAttempts) : 0;

    // Find most difficult tasks (frequent error rates)
    const taskStatMap = new Map<string, { total: number; errors: number; prompt: string }>();

    // Initialize tasks from latest snapshot if available
    if (snapshot?.items) {
      for (const item of snapshot.items) {
        let promptText = '';
        if ('question' in item) promptText = item.question;
        else if ('instructions' in item) promptText = item.instructions;
        taskStatMap.set(item.id, { total: 0, errors: 0, prompt: promptText });
      }
    }

    for (const att of allAttempts) {
      for (const ans of att.answers) {
        let stat = taskStatMap.get(ans.taskId);
        if (!stat) {
          stat = { total: 0, errors: 0, prompt: `Тапсырма ${ans.taskId}` };
          taskStatMap.set(ans.taskId, stat);
        }
        stat.total += 1;
        if (!ans.isCorrect) {
          stat.errors += 1;
        }
      }
    }

    const difficultTasks = Array.from(taskStatMap.entries())
      .filter(([_, stat]) => stat.total > 0)
      .map(([taskId, stat]) => ({
        taskId,
        prompt: stat.prompt,
        errorRatePercentage: Math.round((stat.errors / stat.total) * 100),
      }))
      .sort((a, b) => b.errorRatePercentage - a.errorRatePercentage)
      .slice(0, 5);

    // List participants with Best Score vs Latest Score
    const participantsList = Array.from(participantMap.entries()).map(([_, attempts]) => {
      // Sort attempts by completedAt desc
      const sortedByDate = [...attempts].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
      const latest = sortedByDate[0];

      // Sort by percentage desc for best
      const sortedByScore = [...attempts].sort((a, b) => b.percentage - a.percentage);
      const best = sortedByScore[0];

      const name = latest.user?.name || latest.guestName || 'Қонақ';

      return {
        studentId: latest.userId,
        studentName: name,
        attemptsCount: attempts.length,
        latestPercentage: latest.percentage,
        latestCompletedAt: latest.completedAt.toISOString(),
        bestPercentage: best.percentage,
        bestScore: best.score,
        bestMaxScore: best.maxScore,
        lastAttemptId: latest.id,
      };
    });

    return reply.send({
      gameId: game.id,
      gameTitle: game.title,
      versionNumber: latestVersion?.versionNumber || 1,
      pinCode: activePinCode,
      totalAttempts,
      uniqueParticipants,
      averageScorePercentage,
      averageTimeSpentSeconds,
      difficultTasks,
      participants: participantsList,
    });
  });

  // Student list of personal attempts history
  fastify.get('/student/my-attempts', { preHandler: [authenticateToken] }, async (request, reply) => {
    const userId = request.authUser!.id;

    const attempts = await prisma.attempt.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
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
      },
    });

    const result = attempts.map((att) => ({
      attemptId: att.id,
      gameTitle: att.shareSession.gameVersion.game.title,
      gameType: att.shareSession.gameVersion.game.gameType,
      subject: att.shareSession.gameVersion.game.subject,
      score: att.score,
      maxScore: att.maxScore,
      percentage: att.percentage,
      timeSpentSeconds: att.timeSpentSeconds,
      badge: att.badge,
      pinCode: att.shareSession.pinCode,
      completedAt: att.completedAt.toISOString(),
    }));

    return reply.send(result);
  });
}
