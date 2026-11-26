require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../dist/moderated/moderated.service');

test('each supported track has vertical ladders with valid destinations', async () => {
  for (const trackLength of [30, 50, 80, 100]) {
    const quiz = { title: 'Race', description: null, theme: 'standard', randomizeQuestionOrder: false, snakesLaddersTrackLength: trackLength, questions: [{ id: 1, text: 'Question', itemType: 'question', options: ['Yes', 'No'], correctAnswer: 'Yes', timerSeconds: null }] };
    const service = new ModeratedService({ quiz: { findUnique: async () => quiz } });
    const user = { id: 'teacher' };
    const run = await service.create(1, 'snakes_ladders', 300, false, true, user);
    const board = service.facilitatorState(run.sessionId, user).snakesLadders;
    const columns = trackLength === 30 ? 6 : 10;
    const column = (space) => { const row = Math.floor((space - 1) / columns), offset = (space - 1) % columns; return row % 2 ? columns - 1 - offset : offset; };
    const ladders = board.jumps.filter(({ from, to }) => to > from);
    assert.equal(ladders.length, trackLength === 100 ? 5 : trackLength === 80 ? 4 : 3);
    for (const { from, to } of ladders) {
      assert.equal(column(to), column(from));
      assert.ok(from > 0 && to < trackLength);
      assert.ok(!board.jumps.some((jump) => jump.from === to));
    }
    if (trackLength >= 80) {
      assert.ok(ladders.some(({ from, to }) => Math.floor((to - 1) / columns) - Math.floor((from - 1) / columns) >= 2));
      assert.equal(board.jumps.filter(({ from, to }) => to < from).length, 4);
    }
  }
});

test('projector receives every player move made between refreshes', async () => {
  const quiz = { title: 'Race', description: null, theme: 'standard', randomizeQuestionOrder: false, defaultTimerSeconds: -1, snakesLaddersTrackLength: 30, questions: [{ id: 1, text: 'Question', itemType: 'question', options: ['Yes', 'No'], correctAnswer: 'Yes', timerSeconds: null }] };
  const service = new ModeratedService({ quiz: { findUnique: async () => quiz } });
  const user = { id: 'teacher' }, run = await service.create(1, 'snakes_ladders', 300, false, true, user);
  const players = ['Alex', 'Blair'].map((name) => service.join(run.pin, name, randomUUID()));
  service.start(run.sessionId, user);
  for (const player of players) {
    const question = service.studentState(run.pin, player.participantId).currentQuestion;
    service.submitAnswer(run.pin, { participantId: player.participantId, questionId: question.id, answer: 'Yes' });
    service.rollSnakesLadders(run.pin, player.participantId);
  }
  const moves = service.facilitatorState(run.sessionId, user).snakesLadders.recentMoves;
  assert.deepEqual(moves.map((move) => move.participantId), players.map((player) => player.participantId));
  for (const move of moves) {
    assert.equal(move.landed, move.from + move.roll);
    assert.ok(move.to >= 1 && move.to <= 30);
  }
  service.end(run.sessionId, user);
});
