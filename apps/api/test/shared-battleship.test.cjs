require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../dist/moderated/moderated.service');

const quiz = {
  title: 'Shared Battleship', description: null, theme: 'standard', matchingPairCount: 6, defaultTimerSeconds: -1, randomizeQuestionOrder: false,
  questions: [{ id: 1, text: 'Ready?', itemType: 'question', gameType: null, gameDurationSeconds: null, options: ['Yes', 'No'], correctAnswer: 'Yes', answerCount: null, timerSeconds: null }],
};
const prisma = { quiz: { findUnique: async () => quiz } };

test('battleship awards attack tokens and shares only resolved attacks', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'battleship', 300);
  const student = service.join(run.pin, 'Student', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const question = service.studentState(run.pin, student.participantId).currentQuestion;
  service.submitAnswer(run.pin, { participantId: student.participantId, questionId: question.id, answer: 'Yes' });

  const session = service.sessions.get(run.sessionId);
  session.battleship.shipCells = new Set([0]);
  const beforeAttack = service.studentState(run.pin, student.participantId).battleship;
  assert.equal(beforeAttack.tokens, 1);
  assert.equal(beforeAttack.cells[0].result, null);
  assert.equal(service.facilitatorState(run.sessionId, run.facilitatorToken).presentationMode, 'battleship');

  const afterAttack = service.attackBattleship(run.pin, student.participantId, 0);
  assert.equal(afterAttack.tokens, 0);
  assert.equal(afterAttack.cells[0].result, 'hit');
  assert.equal(service.facilitatorState(run.sessionId, run.facilitatorToken).battleship.hits, 1);
  assert.equal(service.facilitatorState(run.sessionId, run.facilitatorToken).battleship.lastHit.participantName, 'Student');
  assert.throws(() => service.attackBattleship(run.pin, student.participantId, 0), /attack token/);
});

test('battleship uses the selected preset and starts a clean board after the fleet is sunk', async () => {
  const service = new ModeratedService({ quiz: { findUnique: async () => ({ ...quiz, battleshipBoardSize: 6 }) } });
  const run = await service.create(1, 'battleship', 300);
  const student = service.join(run.pin, 'Student', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const question = service.studentState(run.pin, student.participantId).currentQuestion;
  service.submitAnswer(run.pin, { participantId: student.participantId, questionId: question.id, answer: 'Yes' });

  const session = service.sessions.get(run.sessionId);
  assert.equal(session.battleship.size, 6);
  assert.equal(session.battleship.shipCells.size, 7);
  session.battleship.shipCells = new Set([0]);
  const complete = service.attackBattleship(run.pin, student.participantId, 0);
  assert.equal(complete.complete, true);
  assert.ok(complete.completionId);

  const reset = service.resetBoard(run.sessionId, run.facilitatorToken);
  assert.equal(reset.battleship.complete, false);
  assert.equal(reset.battleship.cells.length, 36);
  assert.equal(service.studentState(run.pin, student.participantId).battleship.tokens, 0);
});

test('automatic reset starts a fresh Battleship board after the completion fanfare window', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'battleship', 300);
  const student = service.join(run.pin, 'Student', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const question = service.studentState(run.pin, student.participantId).currentQuestion;
  service.submitAnswer(run.pin, { participantId: student.participantId, questionId: question.id, answer: 'Yes' });
  const session = service.sessions.get(run.sessionId);
  session.battleship.shipCells = new Set([0]);
  service.updateBoardAutoReset(run.sessionId, run.facilitatorToken, true);
  service.attackBattleship(run.pin, student.participantId, 0);
  assert.ok(session.boardResetAt);

  session.boardResetAt = new Date(0);
  const refreshed = service.facilitatorState(run.sessionId, run.facilitatorToken);
  assert.equal(refreshed.battleship.complete, false);
  assert.equal(refreshed.battleship.hits, 0);
});
