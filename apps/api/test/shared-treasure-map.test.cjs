require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../dist/moderated/moderated.service');

const quiz = {
  title: 'Shared Treasure Map', description: null, theme: 'standard', matchingPairCount: 6, defaultTimerSeconds: -1, randomizeQuestionOrder: false,
  questions: [{ id: 1, text: 'Ready?', itemType: 'question', gameType: null, gameDurationSeconds: null, options: ['Yes', 'No'], correctAnswer: 'Yes', answerCount: null, timerSeconds: null }],
};
const prisma = { quiz: { findUnique: async () => quiz } };

test('treasure map rewards scout tokens, reveals shared clues, and resets after finding the chest', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'treasure_map', 300);
  const student = service.join(run.pin, 'Scout', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const question = service.studentState(run.pin, student.participantId).currentQuestion;
  service.submitAnswer(run.pin, { participantId: student.participantId, questionId: question.id, answer: 'Yes' });

  const session = service.sessions.get(run.sessionId);
  assert.equal(session.treasureMap.size, 14);
  assert.ok(session.treasureMap.blockedCells.size > 0);
  assert.throws(() => service.digTreasureMap(run.pin, student.participantId, [...session.treasureMap.blockedCells][0]), /Streams cannot be explored/);
  session.treasureMap.treasureCell = 1;
  const clue = service.digTreasureMap(run.pin, student.participantId, 0);
  assert.equal(clue.tokens, 0);
  assert.equal(clue.cells[0].result, 'clue');
  assert.match(clue.cells[0].hint, /east/);

  session.participants.get(student.participantId).treasureMap.tokens = 1;
  const found = service.digTreasureMap(run.pin, student.participantId, 1);
  assert.equal(found.cells[1].result, 'treasure');
  assert.equal(found.complete, true);
  assert.equal(service.facilitatorState(run.sessionId, run.facilitatorToken).presentationMode, 'treasure_map');

  const reset = service.resetBoard(run.sessionId, run.facilitatorToken);
  assert.equal(reset.treasureMap.complete, false);
  assert.equal(reset.treasureMap.cells.length, 196);
  assert.equal(service.studentState(run.pin, student.participantId).treasureMap.tokens, 0);
});
