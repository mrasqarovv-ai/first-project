import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { hashPassword, comparePassword, authenticateToken } from '../auth.js';

const RegisterSchema = z.object({
  email: z.string().email('Дұрыс email мекенжайын енгізіңіз'),
  password: z.string().min(6, 'Құпиясөз кемінде 6 таңбадан тұруы тиіс'),
  name: z.string().min(2, 'Аты-жөніңізді толық енгізіңіз'),
  role: z.enum(['TEACHER', 'STUDENT']).default('TEACHER'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const GuestLoginSchema = z.object({
  guestName: z.string().min(2, 'Лақап ат немесе есіміңізді енгізіңіз').max(50),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request, reply) => {
    const parse = RegisterSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Деректер дұрыс емес',
        details: parse.error.errors.map(e => e.message),
      });
    }

    const { email, password, name, role } = parse.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'Бұл email мекенжайымен тіркелген пайдаланушы бар' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
      },
    });

    const token = (fastify as any).jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return reply.status(201).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const parse = LoginSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Email немесе құпиясөз қате' });
    }

    const { email, password } = parse.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Email немесе құпиясөз қате' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Email немесе құпиясөз қате' });
    }

    const token = (fastify as any).jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  // Guest Token
  fastify.post('/guest', async (request, reply) => {
    const parse = GuestLoginSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0]?.message || 'Қате деректер' });
    }

    const { guestName } = parse.data;

    // Create a lightweight guest user
    const guestUser = await prisma.user.create({
      data: {
        name: guestName.trim(),
        role: 'GUEST',
      },
    });

    const token = (fastify as any).jwt.sign({
      id: guestUser.id,
      email: null,
      name: guestUser.name,
      role: 'GUEST',
    });

    return reply.send({
      token,
      user: {
        id: guestUser.id,
        name: guestUser.name,
        role: 'GUEST',
      },
    });
  });

  // Current User profile
  fastify.get('/me', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.authUser!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Пайдаланушы табылмады' });
    }

    return reply.send({ user });
  });
}
