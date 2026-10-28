import { randomUUID } from 'node:crypto';

const apiUrl = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const pin = process.argv[2] ?? process.env.PIN;
const studentCount = Number.parseInt(process.env.STUDENTS ?? '25', 10);
const pollMilliseconds = Number.parseInt(process.env.POLL_MS ?? '2000', 10);
const minimumAnswerDelay = Number.parseInt(process.env.MIN_ANSWER_DELAY_MS ?? '800', 10);
const maximumAnswerDelay = Number.parseInt(process.env.MAX_ANSWER_DELAY_MS ?? '4500', 10);

if (!/^\d{6}$/.test(pin ?? '')) {
  throw new Error('Provide the six-digit live-test PIN. Example: npm run simulate:student -- 123456');
}
if (!Number.isInteger(studentCount) || studentCount < 1 || studentCount > 100) {
  throw new Error('STUDENTS must be a whole number between 1 and 100.');
}
if (minimumAnswerDelay < 0 || maximumAnswerDelay < minimumAnswerDelay) {
  throw new Error('Answer delay settings must be non-negative, with MAX_ANSWER_DELAY_MS >= MIN_ANSWER_DELAY_MS.');
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const choose = (items) => items[Math.floor(Math.random() * items.length)];
const randomDelay = () => minimumAnswerDelay + Math.floor(Math.random() * (maximumAnswerDelay - minimumAnswerDelay + 1));
const shuffledIndexes = (length) => Array.from({ length }, (_, index) => index).sort(() => Math.random() - 0.5);
const firstNames = [
  'Avery', 'Cameron', 'Casey', 'Dakota', 'Elliot', 'Emerson', 'Finley', 'Harper', 'Hayden', 'Jamie',
  'Jordan', 'Logan', 'Morgan', 'Parker', 'Quinn', 'Reese', 'Riley', 'Rowan', 'Sage', 'Taylor',
];
const lastNames = ['Bennett', 'Brooks', 'Campbell', 'Carter', 'Collins'];

function studentName(index) {
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  return `${firstNames[index % firstNames.length]} ${lastName[0]}.`;
}

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}/moderated-sessions${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message ?? `${response.status} ${response.statusText}`);
  }
  return body;
}

async function join(index) {
  // Small stagger keeps this realistic and makes the lobby arrival easy to watch.
  await pause(index * 75);
  const name = studentName(index);
  const clientId = randomUUID();
  const joined = await request(`/pin/${pin}/participants`, {
    method: 'POST',
    body: JSON.stringify({ name, clientId }),
  });
  return { clientId, name, participantId: joined.participantId };
}

async function simulateStudent(student, summary) {
  const handledQuestions = new Set();

  for (;;) {
    try {
      const state = await request(`/pin/${pin}?${new URLSearchParams({ participantId: student.participantId, clientId: student.clientId })}`);
      if (state.phase === 'complete' || state.removed) return;

      const question = state.currentQuestion;
      if (state.mode === 'matching' && state.betweenQuestions && question?.answered) {
        await pause(1200 + Math.floor(Math.random() * 1800));
        await request(`/pin/${pin}/matching/next`, {
          method: 'POST',
          body: JSON.stringify({ participantId: student.participantId }),
        });
        summary.matchingAdvances += 1;
        continue;
      }
      if (!question || question.answered || question.timedOut || handledQuestions.has(question.id)) {
        await pause(pollMilliseconds);
        continue;
      }

      handledQuestions.add(question.id);
      await pause(randomDelay());

      if (question.itemType === 'game' && question.gameType === 'coin_catch') {
        await request(`/pin/${pin}/games/scores`, {
          method: 'POST',
          body: JSON.stringify({ participantId: student.participantId, questionId: question.id, score: Math.floor(Math.random() * 31) }),
        });
        summary.games += 1;
      } else if (question.itemType === 'question' && question.special?.kind === 'matching') {
        // The API accepts one pair at a time. Submit each correct pair so an
        // unlimited-timer matching question cannot stall the virtual class.
        for (const index of shuffledIndexes(question.special.pairs.length)) {
          const result = await request(`/pin/${pin}/answers`, {
            method: 'POST',
            body: JSON.stringify({ participantId: student.participantId, questionId: question.id, answer: `match:${index}:${index}` }),
          });
          summary.matchAttempts += 1;
          if (result.answered) summary.answers += 1;
          await pause(120 + Math.floor(Math.random() * 360));
        }
      } else if (question.itemType === 'question' && question.options?.length) {
        await request(`/pin/${pin}/answers`, {
          method: 'POST',
          body: JSON.stringify({ participantId: student.participantId, questionId: question.id, answer: choose(question.options) }),
        });
        summary.answers += 1;
      }
    } catch (error) {
      // A teacher may move to the next question while an artificial student is waiting.
      // Keep the simulation running; the next poll will synchronize its state.
      summary.retries += 1;
      if (summary.retries <= 5 || summary.retries % 20 === 0) {
        console.warn(`${student.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
      await pause(pollMilliseconds);
    }
  }
}

console.log(`Joining ${studentCount} simulated students to PIN ${pin} at ${apiUrl}…`);
const students = await Promise.all(Array.from({ length: studentCount }, (_, index) => join(index)));
console.log(`${students.length} students are in the lobby. Start the test from the facilitator view when ready.`);

const summary = { answers: 0, matchAttempts: 0, matchingAdvances: 0, games: 0, retries: 0 };
const report = setInterval(() => {
  console.log(`Activity: ${summary.answers} answers, ${summary.matchAttempts} matching attempts, ${summary.matchingAdvances} matching advances, ${summary.games} game scores, ${summary.retries} recoverable retries.`);
}, 10_000);

try {
  await Promise.all(students.map((student) => simulateStudent(student, summary)));
  console.log(`Test complete: ${summary.answers} answers, ${summary.matchAttempts} matching attempts, ${summary.matchingAdvances} matching advances, and ${summary.games} game scores submitted.`);
} finally {
  clearInterval(report);
}
