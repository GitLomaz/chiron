require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../dist/moderated/moderated.service');

const quiz = {
  title: 'Shared Curling', description: null, theme: 'standard', matchingPairCount: 6, defaultTimerSeconds: -1, randomizeQuestionOrder: false,
  questions: [{ id: 1, text: 'Ready?', itemType: 'question', gameType: null, gameDurationSeconds: null, options: ['Yes', 'No'], correctAnswer: 'Yes', answerCount: null, timerSeconds: null }],
};
const prisma = { quiz: { findUnique: async () => quiz } };

test('curling awards stones and independently records direction and speed', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'curling', 300);
  const first = service.join(run.pin, 'First', randomUUID());
  const second = service.join(run.pin, 'Second', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const session = service.sessions.get(run.sessionId);

  for (const player of [first, second]) {
    const question = service.studentState(run.pin, player.participantId).currentQuestion;
    service.submitAnswer(run.pin, { participantId: player.participantId, questionId: question.id, answer: 'Yes' });
  }

  const firstStone = service.releaseCurlingStone(run.pin, first.participantId, 0, 85);
  const secondStone = service.releaseCurlingStone(run.pin, second.participantId, 80, 85);
  assert.equal(firstStone.stones, 0);
  assert.equal(firstStone.lastStone.x, 0);
  assert.equal(firstStone.lastStone.y, -32);
  assert.equal(firstStone.lastStone.score, 1000);
  assert.equal(secondStone.lastStone.x, 82);
  assert.equal(secondStone.lastStone.y, -32);

  // The first stone's final position and score remain untouched by another
  // stone occupying the same sheet: Curling mode intentionally has no physics.
  const storedFirst = session.curling.stones.find((stone) => stone.participantId === first.participantId);
  assert.equal(storedFirst.x, 0);
  assert.equal(storedFirst.score, 1000);
  const facilitator = service.facilitatorState(run.sessionId, run.facilitatorToken);
  assert.equal(facilitator.presentationMode, 'curling');
  assert.equal(facilitator.curling.attempts.length, 2);
});
