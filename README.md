# Quizboard

Quizboard is a teacher-led quiz and learning-game platform. Teachers author quizzes, reusable questions, answer pools, and data sets; students join live activities or complete homework through a separate player.

The npm-workspaces repository contains:

- `apps/api`: NestJS API, Prisma, and PostgreSQL. `quizzes`, `data-sets`, `moderated`, and `homework` cover authoring and activities.
- `apps/web`: React/Vite teacher application.
- `apps/student`: React/Vite student player.
- `data`, `scripts`, and `deploy`: content data, simulation tools, and deployment configuration.

Quiz content, users, homework sessions, and homework participants are stored in PostgreSQL. Live moderated sessions are held in API memory and are lost when the API restarts. Teacher sign-in uses Google ID tokens; owned resources are scoped to the signed-in user, with a separate flag for viewing all quizzes. Student flows use session links or PINs and participant identifiers. Speak the Answer homework uses Google Cloud Speech-to-Text; recordings are processed in memory.

## Local setup

Install Node.js 20+, npm 10+, and PostgreSQL 14+. Create a PostgreSQL database, copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env`, and configure `DATABASE_URL`. Set the same Google OAuth web client ID in the API's `GOOGLE_CLIENT_ID` and the teacher app's `VITE_GOOGLE_CLIENT_ID` to use teacher sign-in. Configure Google Cloud credentials and a project when using speech recognition. Keep actual credentials out of version control.

```sh
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

The teacher app defaults to http://localhost:5173, the student app to http://localhost:5174, and the API to http://localhost:3000. `GET /health` checks the API. The example database URL uses port 5433; adjust it for your PostgreSQL installation. See [COMMANDS.md](COMMANDS.md) for commands, [deploy/README.md](deploy/README.md) for deployment, and [AGENTS.md](AGENTS.md) for repository guidance.
