# Серверге орналастыру және өндірістік орта (Deployment Guide)

Бұл құжаттама **OquPlay AI** жүйесін нақты мектептер мен оқушылар пайдалануы үшін тұрақты серверге (Production) орналастыру жолдары сипатталған.

---

## 1. PostgreSQL деректер базасын қосу

Локальды тестілеу үшін жоба SQLite (`file:./dev.db`) пайдаланады. Өндірістік ортада (Production) PostgreSQL ұсынылады.

1. `apps/api/prisma/schema.prisma` файлында провайдерді өзгертіңіз:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. `.env` файлында PostgreSQL байланысын жазыңыз:
   ```env
   DATABASE_URL="postgresql://user:password@db-host:5432/oquplay?schema=public"
   ```
3. Миграцияны серверге қолданыңыз:
   ```bash
   cd apps/api
   npx prisma db push
   npx tsx src/seed.ts
   ```

---

## 2. Docker арқылы Backend-ті іске қосу

API сервері үшін `Dockerfile` үлгісі:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
RUN npm --workspace=@oquplay/shared run build
RUN npm --workspace=@oquplay/api run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 4000
CMD ["npm", "--workspace=@oquplay/api", "run", "start"]
```

---

## 3. Бұлттық платформаларға 1 басумен орналастыру

1. **Render.com немесе Railway.app (Backend + PostgreSQL):**
   - GitHub репозиторийін (`mrasqarovv-ai/first-project`) қосыңыз;
   - Web Service түрін таңдаңыз;
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment Variables:
     - `DATABASE_URL`: PostgreSQL сілтемесі
     - `JWT_SECRET`: кездейсоқ 32-таңбалы код
     - `LLM_API_KEY`: нақты ЖИ кілті (мысалы OpenAI немесе Groq)

2. **Vercel немесе Cloudflare Pages (Web нұсқасы):**
   - Framework: `Vite`
   - Root Directory: `apps/mobile`
   - Build Command: `npm run build:web`
   - Output Directory: `../../dist`
