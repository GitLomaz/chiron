# Quizboard project overview

Quizboard is a teacher-led quiz and learning-game platform. Teachers use an admin application to build quizzes, organize reusable content, and run activities. Students use a separate, focused player to join live sessions or complete homework through a shareable link.

## What the project supports

### Quiz creation and content management

- Create quizzes with a title, description, question order setting, student theme, and default timer.
- Add, edit, reorder, enable, and remove questions.
- Build standard multiple-choice questions, including true/false and matching question types.
- Add game breaks such as Coin Catch, Match Pairs, and Tower Stack.
- Reuse questions from a common-question library.
- Create answer pools and have questions draw a configured number of answers from them.
- Manage data sets made of question-and-answer pairs, then generate quiz content from them.
- Preview the student question view while editing.

### Student experiences

- Take a standard quiz at a shareable quiz URL.
- Join a live activity with a session PIN and a displayed name.
- Complete homework through a private link before its deadline.
- Receive per-question feedback, score updates, timers, progress indicators, and end-of-quiz results.
- Use matching interactions and the available game activities when they are part of the quiz.
- View the selected quiz theme: Standard, Kid-friendly, Christmas, or Halloween.

### Teacher-led activities

- Start live tests in Classic, Facilitated, or Matching mode.
- Use Classic mode for self-paced participation.
- Use Facilitated mode to control when each question is released.
- Use Matching mode for a shared Match Pairs board: teachers choose grids from 2×2 through 10×10; students earn credits, choose cards, and completed attempts animate on the projector.
- Optionally enable live points scoring: correct answers earn base, streak, and speed bonuses.
- Monitor participant progress and scores during a live activity.
- End a session or remove a participant when needed.
- Create homework runs with a closing time and review the results while the API process is running.

## Architecture

| Area | Technology | Responsibility |
| --- | --- | --- |
| `apps/api` | NestJS, Prisma, PostgreSQL | API, validation, quiz storage, content libraries, live sessions, and homework state |
| `apps/web` | React, Vite | Teacher/admin interface for quiz authoring and activity management |
| `apps/student` | React, Vite | Student quiz player, live-session join flow, homework player, and themes |
| `data` | JSON files | Source data used for generated quiz content and seed-like workflows |

The repository is an npm-workspaces monorepo. `npm run dev` starts the API, teacher app, and student app together. By default, the teacher app runs on port 5173, the student app on 5174, and the API on 3000.

## Core data model

- **Quiz** owns its ordered questions and contains presentation settings such as theme, question randomization, and default timer.
- **Question** can be a standard question or a game item. It stores options, the correct answer, optional timer override, and optional answer-pool configuration.
- **CommonQuestion** is reusable content that can be added to quizzes.
- **AnswerPool** contains reusable answer values for dynamically composed questions.
- **DataSet** contains ordered question-and-answer pairs used to generate quiz content.

Quiz and content data are stored in PostgreSQL. Live moderated sessions and homework runs are kept in memory, so they are reset if the API process restarts.

## API areas

The API is organized around these functional areas:

- `quizzes`: quiz, question, common-question, and answer-pool management
- `data-sets`: data-set management and quiz generation
- `play`: standard student quiz delivery and answer submission
- `moderated`: live-session creation, joining, progression, and scoring
- `homework`: homework-run creation, completion, deadlines, and results
- `health`: service status endpoint

## Current limitations and likely next steps

- Live and homework session state is not persistent across API restarts.
- There is no authentication or role management yet; teacher-facing routes rely on the current local deployment model.
- The database schema is intentionally compact and focuses on quiz authoring rather than schools, classes, rosters, or long-term analytics.
- Future work could add persistent session storage, accounts and permissions, class management, richer reporting, and more question or game types.

## Running locally

The project requires Node.js 20+, npm 10+, and PostgreSQL 14+. Configure `DATABASE_URL` in `apps/api/.env`, then run:

```sh
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

For the full setup detail and available commands, see [README.md](README.md).
