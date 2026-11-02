require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../dist/moderated/moderated.service');

const quiz = {
  title: 'Shared Archery', description: null, theme: 'standard', matchingPairCount: 6, defaultTimerSeconds: -1, randomizeQuestionOrder: false,
  questions: [{ id: 1, text: 'Ready?', itemType: 'question', gameType: null, gameDurationSeconds: null, options: ['Yes', 'No'], correctAnswer: 'Yes', answerCount: null, timerSeconds: null }],
};
const prisma = { quiz: { findUnique: async () => quiz } };

test('archery rewards arrows and retains each attempt on the shared target', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'archery', 300);
  const student = service.join(run.pin, 'Archer', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const question = service.studentState(run.pin, student.participantId).currentQuestion;
  service.submitAnswer(run.pin, { participantId: student.participantId, questionId: question.id, answer: 'Yes' });

  const first = service.shootArchery(run.pin, student.participantId, 80, 80);
  assert.equal(first.arrows, 0);
  assert.equal(first.lastShot.score, 1);
  assert.equal(first.attempts[0].score, 1);

  const session = service.sessions.get(run.sessionId);
  session.participants.get(student.participantId).archery.arrows = 1;
  const bullseye = service.shootArchery(run.pin, student.participantId, 0, 0);
  assert.equal(bullseye.attempts.length, 2);
  assert.equal(bullseye.attempts[0].score, 1000);
  assert.equal(bullseye.attempts[1].score, 1);
  const facilitator = service.facilitatorState(run.sessionId, run.facilitatorToken);
  assert.equal(facilitator.presentationMode, 'archery');
  assert.equal(facilitator.archery.attempts[0].participantName, 'Archer');
});
