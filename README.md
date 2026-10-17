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

4. Start both applications:

   ```sh
   npm run dev
   ```

   The frontend is served at `http://localhost:5173`; the API is at `http://localhost:3000` and `GET /health` returns its status.

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
