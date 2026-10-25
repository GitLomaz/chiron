# Trivia

A minimal quiz-management foundation built as an npm-workspaces monorepo.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL 14 or newer

## Quick start

1. Create a PostgreSQL database named `trivia`:

   ```sql
   CREATE DATABASE trivia;
   ```

2. Copy the environment examples for each application:

   ```sh
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

   On Windows PowerShell, use `Copy-Item apps/api/.env.example apps/api/.env` and `Copy-Item apps/web/.env.example apps/web/.env` instead. Update `DATABASE_URL` if your PostgreSQL credentials or port differ.

3. Install packages, create the Prisma client, and apply the included initial migration:

   ```sh
   npm install
   npm run db:generate
   npm run db:migrate
   ```

4. Start the admin app, API, and student player:

   ```sh
   npm run dev
   ```

   The admin app is served at `http://localhost:5173`, the student player at `http://localhost:5174`, and the API is at `http://localhost:3000` (`GET /health` returns its status).

## Student quiz player

Teachers create a run for each quiz: a live test or a homework run. Homework runs are in-memory snapshots, shared at `http://localhost:5174/homework/<session-id>`, and have a private teacher results view. Student names, completion, and scores are retained for the life of that API process; restarting it clears active runs.

Live runs offer Classic (self-paced), Facilitated (the teacher releases each round), and Matching. Matching skips the quiz's game breaks and gives students a matching break between questions. Students earn a credit on their first correct answer, their third, and every third correct answer thereafter; an incorrect pair costs one credit. Homework uses Classic mode.

## Commands

- `npm run dev` — run React and NestJS together
- `npm run build` — type-check and build both applications
- `npm run db:generate` — regenerate Prisma Client after schema changes
- `npm run db:migrate` — apply pending development migrations

## PostgreSQL notes

The connection string follows the normal PostgreSQL URL format:

```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

For Docker-based local PostgreSQL, one possible command is:

```sh
docker run --name trivia-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=trivia -p 5433:5432 -d postgres:16
```

The Docker command maps PostgreSQL to host port `5433`; the included `.env.example` files match it. If you use an existing PostgreSQL installation, set its host and port in `DATABASE_URL` instead.

The schema intentionally contains only `Quiz` and `Question`. A quiz owns its questions; deleting it cascades to those questions.
