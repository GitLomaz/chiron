require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../dist/moderated/moderated.service');

const quiz = {
  title: 'Shared matching', description: null, theme: 'standard', matchingPairCount: 4, defaultTimerSeconds: -1, randomizeQuestionOrder: false,
  questions: [{ id: 1, text: 'Ready?', itemType: 'question', gameType: null, gameDurationSeconds: null, options: ['Yes', 'No'], correctAnswer: 'Yes', answerCount: null, timerSeconds: null }],
};
const prisma = { quiz: { findUnique: async () => quiz } };

test('matching mode shares one board and only broadcasts a completed two-card attempt', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'matching', 300);
  const alice = service.join(run.pin, 'Alice', randomUUID());
  const bob = service.join(run.pin, 'Bob', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  for (const student of [alice, bob]) {
    const state = service.studentState(run.pin, student.participantId);
    service.submitAnswer(run.pin, { participantId: student.participantId, questionId: state.currentQuestion.id, answer: 'Yes' });
  }

  const session = service.sessions.get(run.sessionId);
  assert.equal(session.matching.cards.length, 8);
  assert.equal(service.facilitatorState(run.sessionId, run.facilitatorToken).presentationMode, 'matching');
  assert.equal(service.updatePresentationMode(run.sessionId, run.facilitatorToken, 'scores').presentationMode, 'scores');
  service.updatePresentationMode(run.sessionId, run.facilitatorToken, 'matching');
  session.matching.cards = ['A', 'B', 'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
  const firstPick = service.flipMatchingCard(run.pin, alice.participantId, 0);
  assert.deepEqual(firstPick.selectedCard, { id: 0, symbol: 'A' });
  assert.equal(firstPick.attempt, null);
  assert.equal(service.studentState(run.pin, bob.participantId).matching.selectedCard, null);
  assert.equal(service.studentState(run.pin, bob.participantId).matching.cards[0].symbol, null);

  const attempt = service.flipMatchingCard(run.pin, alice.participantId, 2);
  assert.equal(attempt.attempt.isMatch, true);
  assert.equal(attempt.attempt.isActor, true);
  assert.deepEqual(attempt.attempt.cards, [{ id: 0, symbol: 'A' }, { id: 2, symbol: 'A' }]);
  assert.equal(service.facilitatorState(run.sessionId, run.facilitatorToken).matching.attempt.id, attempt.attempt.id);

  session.matching.attempt.startedAt = new Date(0);
  const shared = service.studentState(run.pin, bob.participantId).matching;
  assert.equal(shared.attempt, null);
  assert.equal(shared.cards[0].matched, true);
  assert.equal(shared.cards[2].matched, true);

  service.flipMatchingCard(run.pin, bob.participantId, 1);
  const mismatch = service.flipMatchingCard(run.pin, bob.participantId, 3);
  assert.equal(mismatch.attempt.isMatch, false);
  assert.equal(mismatch.attempt.isActor, true);
  assert.equal(mismatch.credits, 0);
  assert.equal(service.studentState(run.pin, alice.participantId).matching.attempt, null);
  session.matching.attempt.startedAt = new Date(0);
  const afterMismatch = service.studentState(run.pin, alice.participantId).matching;
  assert.equal(afterMismatch.attempt, null);
  assert.equal(afterMismatch.cards[1].symbol, null);
  assert.equal(afterMismatch.cards[3].symbol, null);
});

test('matching mode supports a 10 by 10 board', async () => {
  const service = new ModeratedService({ quiz: { findUnique: async () => ({ ...quiz, matchingPairCount: 50 }) } });
  const run = await service.create(1, 'matching', 300);
  const student = service.join(run.pin, 'Student', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const matching = service.studentState(run.pin, student.participantId).matching;
  assert.equal(matching.cards.length, 100);
  assert.equal(matching.columns, 10);
  assert.equal(matching.rows, 10);
});
