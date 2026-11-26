# Agent guide

Quizboard is an npm-workspaces monorepo: `apps/api` is the NestJS/Prisma API, `apps/web` is the teacher React app, and `apps/student` is the student React app. See `README.md` for setup and `COMMANDS.md` for commands.

## Where to work

- API routes and business logic live in `apps/api/src`: `quizzes` owns authoring, `data-sets` handles datasets and quiz generation, `moderated` handles live sessions, and `homework` handles homework and speech recognition. `question-types` contains shared scoring and question helpers.
- `apps/api/prisma/schema.prisma` and `migrations/` define persistent data. Quiz content, users, and homework sessions/participants are stored in PostgreSQL; live moderated sessions are in memory and disappear on an API restart.
- Google sign-in protects teacher routes with `GoogleAuthGuard`; student routes use session/participant identifiers and, where applicable, facilitator tokens. Preserve ownership checks and avoid exposing answer keys or credentials in student responses.
- Teacher and student UI entry points are `apps/web/src/App.tsx` and `apps/student/src/App.tsx`. Changes to session payloads or modes often require coordinated API and both frontend changes.
- API TypeScript is authoritative. Generated JavaScript belongs in `apps/api/dist`, not beside source files. Tests in `apps/api/test` import the compiled API, so rebuild before running them.
- `apps/api/src/play` is present but `PlayModule` is not registered in `AppModule`; do not assume those routes are active.

## Working practices

- Inspect the working tree before changes and preserve existing user work, including untracked directories. Do not edit `.env` secrets or generated output.
- Use the existing Prisma migration workflow for schema changes; do not rewrite migrations that may already have been applied. Database migration and seed commands alter local data.
- Run `npm run build` and the relevant API tests after changes. The test suite uses Node's test runner and mostly mocks dependencies; it is not a substitute for a real database or browser integration check.
- Some existing API tests have stale fixtures and expectations for current service signatures and authentication. Check failures before attributing them to a new change; do not restore generated source-side JavaScript to make tests pass.
- Do not infer that a local build or mocked test verifies Google OAuth, cloud speech credentials, deployed services, or database migration compatibility.
