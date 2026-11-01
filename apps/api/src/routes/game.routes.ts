import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticateToken } from '../auth.js';
import { generateGameWithAI } from '../ai/llm-service.js';
import {
  GenerateGameRequestSchema,
  GameSnapshotSchema,
  GameSnapshot,
} from '@oquplay/shared';

export async function gameRoutes(fastify: FastifyInstance) {
  // Generate game with AI (or Demo fallback if no key)
  fastify.post('/generate', { preHandler: [authenticateToken] }, async (request, reply) => {
    const parse = GenerateGameRequestSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Сұраныс параметрлері қате',
        details: parse.error.errors.map((e) => e.message),
      });
    }

    try {
      const result = await generateGameWithAI(parse.data);
      return reply.send({
        success: true,
        snapshot: result.snapshot,
        isDemo: result.isDemo,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        error: err.message || 'ЖИ генерациясы сәтсіз аяқталды',
      });
    }
  });

  // List games for current user with filters & search
  fastify.get('/', { preHandler: [authenticateToken] }, async (request, reply) => {
    const userId = request.authUser!.id;
    const { status, subject, gameType, search } = request.query as any;

    const where: any = { ownerId: userId };
    if (status) where.status = status;
    if (subject) where.subject = subject;
    if (gameType) where.gameType = gameType;
    if (search && search.trim() !== '') {
      where.title = { contains: search.trim() };
    }

    const games = await prisma.game.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            shareSessions: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    const summaries = games.map((g) => {
      const latestVersion = g.versions[0];
      let pinCode: string | undefined;
      let itemCount = 0;

      if (latestVersion) {
        if (latestVersion.shareSessions.length > 0) {
          pinCode = latestVersion.shareSessions[0].pinCode;
        }
        try {
          const snap = JSON.parse(latestVersion.snapshotJson);
          itemCount = snap.items?.length || 0;
        } catch {}
      }

      return {
        id: g.id,
        title: g.title,
        subject: g.subject,
        grade: g.grade,
        language: g.language,
        difficulty: g.difficulty,
        gameType: g.gameType,
        status: g.status,
        versionNumber: latestVersion?.versionNumber || 1,
        pinCode,
        itemCount,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      };
    });

    return reply.send(summaries);
  });

  // Get single game with current snapshot
  fastify.get('/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.authUser!.id;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            shareSessions: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!game) {
      return reply.status(404).send({ error: 'Ойын табылмады' });
    }

    if (game.ownerId !== userId) {
      return reply.status(403).send({ error: 'Бұл ойынды көруге рұқсатыңыз жоқ' });
    }

    const latestVersion = game.versions[0];
    let snapshot: GameSnapshot | null = null;
    let pinCode: string | undefined;

    if (latestVersion) {
      try {
        snapshot = JSON.parse(latestVersion.snapshotJson);
      } catch {}
      if (latestVersion.shareSessions.length > 0) {
        pinCode = latestVersion.shareSessions[0].pinCode;
      }
    }

    return reply.send({
      id: game.id,
      ownerId: game.ownerId,
      title: game.title,
      subject: game.subject,
      grade: game.grade,
      language: game.language,
      difficulty: game.difficulty,
      gameType: game.gameType,
      status: game.status,
      versionNumber: latestVersion?.versionNumber || 1,
      pinCode,
      snapshot,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    });
  });

  // Save new game (Draft or Published)
  fastify.post('/', { preHandler: [authenticateToken] }, async (request, reply) => {
    const userId = request.authUser!.id;
    const body = request.body as any;

    const snapshotParse = GameSnapshotSchema.safeParse(body.snapshot);
    if (!snapshotParse.success) {
      return reply.status(400).send({
        error: 'Ойын құрылымы дұрыс емес',
        details: snapshotParse.error.errors.map((e) => e.message),
      });
    }

    const snapshot = snapshotParse.data;
    const status = body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

    const game = await prisma.game.create({
      data: {
        ownerId: userId,
        title: snapshot.title,
        subject: snapshot.subject,
        grade: snapshot.grade,
        language: snapshot.language,
        difficulty: snapshot.difficulty,
        gameType: snapshot.gameType,
        status,
        versions: {
          create: {
            versionNumber: 1,
            instructions: snapshot.instructions || '',
            snapshotJson: JSON.stringify(snapshot),
          },
        },
      },
      include: {
        versions: true,
      },
    });

    let pinCode: string | undefined;
    if (status === 'PUBLISHED') {
      pinCode = await generateUniquePin();
      await prisma.shareSession.create({
        data: {
          gameVersionId: game.versions[0].id,
          pinCode,
          isActive: true,
        },
      });
    }

    return reply.status(201).send({
      id: game.id,
      title: game.title,
      status: game.status,
      versionNumber: 1,
      pinCode,
      snapshot,
    });
  });

  // Update existing game
  // Rule: If game is PUBLISHED, creating an edit creates a NEW GameVersion to maintain immutability of historical results!
  fastify.put('/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.authUser!.id;
    const body = request.body as any;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!game) {
      return reply.status(404).send({ error: 'Ойын табылмады' });
    }

    if (game.ownerId !== userId) {
      return reply.status(403).send({ error: 'Бұл ойынды өңдеуге рұқсатыңыз жоқ' });
    }

    const snapshotParse = GameSnapshotSchema.safeParse(body.snapshot);
    if (!snapshotParse.success) {
      return reply.status(400).send({
        error: 'Ойын құрылымы дұрыс емес',
        details: snapshotParse.error.errors.map((e) => e.message),
      });
    }

    const snapshot = snapshotParse.data;
    const latestVersion = game.versions[0];

    // If game was already published, create a new version to preserve older student records
    if (game.status === 'PUBLISHED') {
      const nextVersionNumber = (latestVersion?.versionNumber || 1) + 1;
      const newVersion = await prisma.gameVersion.create({
        data: {
          gameId: game.id,
          versionNumber: nextVersionNumber,
          instructions: snapshot.instructions || '',
          snapshotJson: JSON.stringify(snapshot),
        },
      });

      // Update game metadata
      await prisma.game.update({
        where: { id: game.id },
        data: {
          title: snapshot.title,
          subject: snapshot.subject,
          grade: snapshot.grade,
          language: snapshot.language,
          difficulty: snapshot.difficulty,
        },
      });

      return reply.send({
        id: game.id,
        versionNumber: newVersion.versionNumber,
        snapshot,
        message: 'Жаңа нұсқа сақталды (бұрынғы нәтижелер сақталды)',
      });
    } else {
      // Draft mode: update latest version snapshot directly
      if (latestVersion) {
        await prisma.gameVersion.update({
          where: { id: latestVersion.id },
          data: {
            instructions: snapshot.instructions || '',
            snapshotJson: JSON.stringify(snapshot),
          },
        });
      }

      await prisma.game.update({
        where: { id: game.id },
        data: {
          title: snapshot.title,
          subject: snapshot.subject,
          grade: snapshot.grade,
          language: snapshot.language,
          difficulty: snapshot.difficulty,
        },
      });

      return reply.send({
        id: game.id,
        versionNumber: latestVersion?.versionNumber || 1,
        snapshot,
      });
    }
  });

  // Publish game & generate 6-digit PIN
  fastify.post('/:id/publish', { preHandler: [authenticateToken] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.authUser!.id;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            shareSessions: true,
          },
        },
      },
    });

    if (!game) {
      return reply.status(404).send({ error: 'Ойын табылмады' });
    }

    if (game.ownerId !== userId) {
      return reply.status(403).send({ error: 'Бұл ойынды жариялауға рұқсатыңыз жоқ' });
    }

    const latestVersion = game.versions[0];
    if (!latestVersion) {
      return reply.status(400).send({ error: 'Ойынның жарамды нұсқасы табылмады' });
    }

    // Check if there is an active PIN already
    let activeSession = latestVersion.shareSessions.find((s) => s.isActive);
    let pinCode: string;

    if (activeSession) {
      pinCode = activeSession.pinCode;
    } else {
      pinCode = await generateUniquePin();
      await prisma.shareSession.create({
        data: {
          gameVersionId: latestVersion.id,
          pinCode,
          isActive: true,
        },
      });
    }

    await prisma.game.update({
      where: { id: game.id },
      data: { status: 'PUBLISHED' },
    });

    return reply.send({
      id: game.id,
      status: 'PUBLISHED',
      pinCode,
      message: 'Ойын сәтті жарияланды!',
    });
  });

  // Unpublish / Archive game (closes PIN access)
  fastify.post('/:id/archive', { preHandler: [authenticateToken] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.authUser!.id;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        versions: {
          include: {
            shareSessions: true,
          },
        },
      },
    });

    if (!game) {
      return reply.status(404).send({ error: 'Ойын табылмады' });
    }

    if (game.ownerId !== userId) {
      return reply.status(403).send({ error: 'Бұл ойынды өзгертуге құқығыңыз жоқ' });
    }

    // Deactivate all share sessions
    for (const v of game.versions) {
      for (const s of v.shareSessions) {
        if (s.isActive) {
          await prisma.shareSession.update({
            where: { id: s.id },
            data: { isActive: false },
          });
        }
      }
    }

    await prisma.game.update({
      where: { id: game.id },
      data: { status: 'ARCHIVED' },
    });

    return reply.send({
      id: game.id,
      status: 'ARCHIVED',
      message: 'Ойын жарияланудан алынды және мұрағатталды',
    });
  });

  // Duplicate game
  fastify.post('/:id/duplicate', { preHandler: [authenticateToken] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.authUser!.id;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!game) {
      return reply.status(404).send({ error: 'Ойын табылмады' });
    }

    if (game.ownerId !== userId) {
      return reply.status(403).send({ error: 'Бұл ойынды көшіруге рұқсатыңыз жоқ' });
    }

    const latestVersion = game.versions[0];
    const snapshotJson = latestVersion?.snapshotJson || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(snapshotJson);
    } catch {}

    const duplicateTitle = `${game.title} (Көшірме)`;
    parsed.title = duplicateTitle;

    const newGame = await prisma.game.create({
      data: {
        ownerId: userId,
        title: duplicateTitle,
        subject: game.subject,
        grade: game.grade,
        language: game.language,
        difficulty: game.difficulty,
        gameType: game.gameType,
        status: 'DRAFT',
        versions: {
          create: {
            versionNumber: 1,
            instructions: latestVersion?.instructions || '',
            snapshotJson: JSON.stringify(parsed),
          },
        },
      },
    });

    return reply.status(201).send({
      id: newGame.id,
      title: newGame.title,
      status: 'DRAFT',
    });
  });
}

/**
 * Generates a non-guessable 6-digit numeric PIN
 */
async function generateUniquePin(): Promise<string> {
  let pin = '';
  let exists = true;
  while (exists) {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
    const found = await prisma.shareSession.findUnique({ where: { pinCode: pin } });
    if (!found) exists = false;
  }
  return pin;
}
