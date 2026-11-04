require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../src/moderated/moderated.service');

const quiz = {
  title: 'Restartable quiz', description: null, theme: 'standard', defaultTimerSeconds: -1, randomizeQuestionOrder: false,
  questions: [1, 2].map((id) => ({ id, text: `Question ${id}`, itemType: 'question', gameType: null, gameDurationSeconds: null, options: ['Yes', 'No'], correctAnswer: 'Yes', answerCount: null, timerSeconds: null })),
};
const prisma = { quiz: { findUnique: async () => quiz } };

test('relaunching a finished live quiz keeps participants and resets their progress for the selected mode', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'classic', 300, true);
  const alex = service.join(run.pin, 'Alex', randomUUID());
  const bea = service.join(run.pin, 'Bea', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);

  const first = service.studentState(run.pin, alex.participantId).currentQuestion;
  service.submitAnswer(run.pin, { participantId: alex.participantId, questionId: first.id, answer: 'Yes' });
  service.end(run.sessionId, run.facilitatorToken);

  const ended = service.facilitatorState(run.sessionId, run.facilitatorToken);
  assert.equal(ended.scoreLeaderboard.find((player) => player.id === alex.participantId).longestStreak, 1);
  assert.equal(ended.scoreLeaderboard.find((player) => player.id === alex.participantId).answered, 1);

  const restarted = service.restart(run.sessionId, run.facilitatorToken, 'matching');
  assert.equal(restarted.phase, 'question');
  assert.equal(restarted.mode, 'matching');
  assert.equal(restarted.pin, run.pin);
  assert.deepEqual(new Set(restarted.participants.map((player) => player.id)), new Set([alex.participantId, bea.participantId]));
  assert.deepEqual(service.studentState(run.pin, alex.participantId).score, { correct: 0, answered: 0, points: 0, streak: 0, lastAward: null });
  assert.ok(service.studentState(run.pin, alex.participantId).matching);

  service.end(run.sessionId, run.facilitatorToken);
  const facilitated = service.restart(run.sessionId, run.facilitatorToken, 'facilitated');
  assert.equal(facilitated.mode, 'facilitated');
  assert.equal(facilitated.endless, false);
});
