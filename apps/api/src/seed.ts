import { prisma } from './db.js';
import { hashPassword } from './auth.js';
import { DEMO_QUIZ_KK, DEMO_MATCHING_KK, DEMO_ORDERING_KK } from './ai/demo-templates.js';

export async function seedDatabase() {
  console.log('🌱 Базаны бастапқы деректермен толтыру басталды...');

  // 1. Create or get Teacher
  const teacherPasswordHash = await hashPassword('oquplay123');
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@oquplay.kz' },
    update: {},
    create: {
      email: 'teacher@oquplay.kz',
      passwordHash: teacherPasswordHash,
      name: 'Айгүл Мұғалім',
      role: 'TEACHER',
    },
  });

  // 2. Create or get Student
  const studentPasswordHash = await hashPassword('oquplay123');
  const student = await prisma.user.upsert({
    where: { email: 'student@oquplay.kz' },
    update: {},
    create: {
      email: 'student@oquplay.kz',
      passwordHash: studentPasswordHash,
      name: 'Әлихан Оқушы',
      role: 'STUDENT',
    },
  });

  // 3. Create Sample Quiz Game
  let quizGame = await prisma.game.findFirst({
    where: { ownerId: teacher.id, title: DEMO_QUIZ_KK.title },
    include: {
      versions: {
        include: {
          shareSessions: true,
        },
      },
    },
  });

  if (!quizGame) {
    quizGame = await prisma.game.create({
      data: {
        ownerId: teacher.id,
        title: DEMO_QUIZ_KK.title,
        subject: DEMO_QUIZ_KK.subject,
        grade: DEMO_QUIZ_KK.grade,
        language: DEMO_QUIZ_KK.language,
        difficulty: DEMO_QUIZ_KK.difficulty,
        gameType: DEMO_QUIZ_KK.gameType,
        status: 'PUBLISHED',
        versions: {
          create: {
            versionNumber: 1,
            instructions: DEMO_QUIZ_KK.instructions,
            snapshotJson: JSON.stringify(DEMO_QUIZ_KK),
            shareSessions: {
              create: {
                pinCode: '718293',
                isActive: true,
              },
            },
          },
        },
      },
      include: {
        versions: {
          include: {
            shareSessions: true,
          },
        },
      },
    });

    const shareSession = quizGame.versions[0].shareSessions[0];

    // Add sample student attempt
    await prisma.attempt.create({
      data: {
        shareSessionId: shareSession.id,
        userId: student.id,
        guestName: student.name,
        score: 5,
        maxScore: 5,
        percentage: 100,
        timeSpentSeconds: 42,
        badge: 'EXCELLENT',
        answers: {
          create: DEMO_QUIZ_KK.items.map((item: any) => ({
            taskId: item.id,
            studentAnswerJson: JSON.stringify(item.correctOptionId),
            isCorrect: true,
            scoreAwarded: 1,
            maxScore: 1,
          })),
        },
      },
    });

    // Add sample guest attempt
    await prisma.attempt.create({
      data: {
        shareSessionId: shareSession.id,
        userId: null,
        guestName: 'Нұрсұлтан (қонақ)',
        score: 4,
        maxScore: 5,
        percentage: 80,
        timeSpentSeconds: 58,
        badge: 'GOOD',
        answers: {
          create: DEMO_QUIZ_KK.items.map((item: any, idx: number) => ({
            taskId: item.id,
            studentAnswerJson: JSON.stringify(idx === 1 ? 'opt-2c' : item.correctOptionId),
            isCorrect: idx !== 1,
            scoreAwarded: idx !== 1 ? 1 : 0,
            maxScore: 1,
          })),
        },
      },
    });
  }

  // 4. Create Sample Matching Game
  let matchingGame = await prisma.game.findFirst({
    where: { ownerId: teacher.id, title: DEMO_MATCHING_KK.title },
  });

  if (!matchingGame) {
    await prisma.game.create({
      data: {
        ownerId: teacher.id,
        title: DEMO_MATCHING_KK.title,
        subject: DEMO_MATCHING_KK.subject,
        grade: DEMO_MATCHING_KK.grade,
        language: DEMO_MATCHING_KK.language,
        difficulty: DEMO_MATCHING_KK.difficulty,
        gameType: DEMO_MATCHING_KK.gameType,
        status: 'PUBLISHED',
        versions: {
          create: {
            versionNumber: 1,
            instructions: DEMO_MATCHING_KK.instructions,
            snapshotJson: JSON.stringify(DEMO_MATCHING_KK),
            shareSessions: {
              create: {
                pinCode: '452819',
                isActive: true,
              },
            },
          },
        },
      },
    });
  }

  // 5. Create Sample Ordering Game (Draft)
  let orderingGame = await prisma.game.findFirst({
    where: { ownerId: teacher.id, title: DEMO_ORDERING_KK.title },
  });

  if (!orderingGame) {
    await prisma.game.create({
      data: {
        ownerId: teacher.id,
        title: DEMO_ORDERING_KK.title,
        subject: DEMO_ORDERING_KK.subject,
        grade: DEMO_ORDERING_KK.grade,
        language: DEMO_ORDERING_KK.language,
        difficulty: DEMO_ORDERING_KK.difficulty,
        gameType: DEMO_ORDERING_KK.gameType,
        status: 'DRAFT',
        versions: {
          create: {
            versionNumber: 1,
            instructions: DEMO_ORDERING_KK.instructions,
            snapshotJson: JSON.stringify(DEMO_ORDERING_KK),
          },
        },
      },
    });
  }

  console.log('✅ Бастапқы деректер сәтті жазылды:');
  console.log('  👨‍🏫 Мұғалім: teacher@oquplay.kz / oquplay123');
  console.log('  👨‍🎓 Оқушы: student@oquplay.kz / oquplay123');
  console.log('  🎮 Викторина коды: 718293');
  console.log('  🎮 Сәйкестендіру коды: 452819');
}

// Direct invocation check
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .catch((err) => {
      console.error('Seed қатесі:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
