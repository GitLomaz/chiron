require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../src/moderated/moderated.service');

const quiz = {
  title: 'Scoring test', description: null, theme: 'standard', defaultTimerSeconds: -1, randomizeQuestionOrder: false,
  questions: [1, 2, 3].map((id) => ({ id, text: `Question ${id}`, itemType: 'question', gameType: null, gameDurationSeconds: null, options: ['Yes', 'No'], correctAnswer: 'Yes', answerCount: null, timerSeconds: null })),
};
const prisma = { quiz: { findUnique: async () => quiz } };

test('live scoring is enabled by default', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'classic', 300);
  assert.equal(service.facilitatorState(run.sessionId, run.facilitatorToken).scoringEnabled, true);
});

test('live scoring awards correct, streak, and speed points and resets on an incorrect answer', async () => {
  const originalNow = Date.now;
  let now = 1_000;
  Date.now = () => now;
  try {
    const service = new ModeratedService(prisma);
    const run = await service.create(1, 'classic', 300, false, true);
    const student = service.join(run.pin, 'Student', randomUUID());
    service.start(run.sessionId, run.facilitatorToken);
    const session = service.sessions.get(run.sessionId);
    const participant = session.participants.get(student.participantId);
    participant.currentQuestionOpenedAt = new Date(now);

    now = 6_000;
    let state = service.studentState(run.pin, student.participantId);
    service.submitAnswer(run.pin, { participantId: student.participantId, questionId: state.currentQuestion.id, answer: 'Yes' });
    service.openParticipantQuestion(session, participant);
    participant.currentQuestionOpenedAt = new Date(now);

    now = 11_000;
    state = service.studentState(run.pin, student.participantId);
    service.submitAnswer(run.pin, { participantId: student.participantId, questionId: state.currentQuestion.id, answer: 'Yes' });
    service.openParticipantQuestion(session, participant);

    now = 16_000;
    state = service.studentState(run.pin, student.participantId);
    service.submitAnswer(run.pin, { participantId: student.participantId, questionId: state.currentQuestion.id, answer: 'No' });
    service.end(run.sessionId, run.facilitatorToken);

    assert.deepEqual(service.studentState(run.pin, student.participantId).score, {
      correct: 2, answered: 3, points: 391, streak: 0, lastAward: null,
    });
    assert.equal(service.facilitatorState(run.sessionId, run.facilitatorToken).scoreLeaderboard[0].score, 391);
  } finally {
    Date.now = originalNow;
  }
});

for (const mode of ['classic', 'facilitated', 'matching']) test(`${mode} supports optional live scoring`, async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, mode, 300, false, true);
  assert.equal(service.facilitatorState(run.sessionId, run.facilitatorToken).scoringEnabled, true);
});
