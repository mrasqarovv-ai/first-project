import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.routes.js';
import { gameRoutes } from './routes/game.routes.js';
import { playRoutes } from './routes/play.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';
const jwtSecret = process.env.JWT_SECRET || 'oquplay-secret-key-change-in-production-2026';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
  });

  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: '7d',
    },
  });

  // Health check
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'OquPlay AI API',
      timestamp: new Date().toISOString(),
      llmMode: process.env.LLM_API_KEY ? 'LIVE_AI' : 'DEMO_MODE',
    };
  });

  // Register feature routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(gameRoutes, { prefix: '/api/games' });
  await fastify.register(playRoutes, { prefix: '/api/play' });
  await fastify.register(analyticsRoutes, { prefix: '/api' });

  await fastify.ready();
  return fastify;
}

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port, host });
    console.log(`🚀 OquPlay AI Backend сервері іске қосылды: http://${host}:${port}`);
    console.log(`📋 Денсаулық тексеру: http://${host}:${port}/api/health`);
    console.log(`🤖 ЖИ режимі: ${process.env.LLM_API_KEY ? 'Шынайы LLM API' : 'Педагогикалық Демо режимі (кілтсіз)'}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
