import bcrypt from 'bcryptjs';
import { FastifyRequest, FastifyReply } from 'fastify';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AuthUserPayload {
  id: string;
  email: string | null;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'GUEST';
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUserPayload;
  }
}

export async function authenticateToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Аутентификация токені қажет' });
    }

    const token = authHeader.substring(7);
    const decoded = (request.server as any).jwt.verify(token) as AuthUserPayload;
    request.authUser = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Жарамсыз немесе мерзімі өткен токен' });
  }
}

export function requireRole(allowedRoles: ('TEACHER' | 'STUDENT' | 'GUEST')[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.authUser) {
      return reply.status(401).send({ error: 'Жүйеге кіру қажет' });
    }
    if (!allowedRoles.includes(request.authUser.role)) {
      return reply.status(403).send({ error: 'Бұл әрекетке құқығыңыз жеткіліксіз' });
    }
  };
}
