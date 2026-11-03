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

test('archery keeps player targets private and limits the shared target to each player\'s best three shots', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'archery', 300);
  const archer = service.join(run.pin, 'Archer', randomUUID());
  const ranger = service.join(run.pin, 'Ranger', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const session = service.sessions.get(run.sessionId);

  for (const participant of [archer, ranger]) {
    const question = service.studentState(run.pin, participant.participantId).currentQuestion;
    service.submitAnswer(run.pin, { participantId: participant.participantId, questionId: question.id, answer: 'Yes' });
    session.participants.get(participant.participantId).archery.arrows = 4;
  }

  for (const x of [40, 30, 20, 10]) service.shootArchery(run.pin, archer.participantId, x, 0);
  for (const x of [35, 25, 15, 5]) service.shootArchery(run.pin, ranger.participantId, x, 0);

  const archerState = service.studentState(run.pin, archer.participantId).archery;
  assert.equal(archerState.attempts.length, 4);
  assert.deepEqual(archerState.attempts.map((attempt) => attempt.score), [900, 800, 700, 600]);
  assert.ok(archerState.attempts.every((attempt) => attempt.participantName === undefined));

  const facilitator = service.facilitatorState(run.sessionId, run.facilitatorToken);
  assert.equal(facilitator.archery.attempts.length, 6);
  assert.deepEqual(
    facilitator.archery.attempts.filter((attempt) => attempt.participantName === 'Archer').map((attempt) => attempt.score),
    [900, 800, 700],
  );
  assert.deepEqual(
    facilitator.archery.attempts.filter((attempt) => attempt.participantName === 'Ranger').map((attempt) => attempt.score),
    [950, 850, 750],
  );
});
