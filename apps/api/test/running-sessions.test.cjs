require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ModeratedService } = require('../src/moderated/moderated.service');
const { HomeworkService } = require('../src/homework/homework.service');

const quiz = { title: 'Vocabulary', description: null, theme: 'standard', randomizeQuestionOrder: false, defaultTimerSeconds: -1, questions: [{ id: 1, text: 'Hello', itemType: 'question', gameType: null, options: ['Hello', 'Bye'], correctAnswer: 'Hello', timerSeconds: null }] };
const prisma = { quiz: { findUnique: async () => quiz } };

test('live listing includes lobbies and active runs, but excludes ended or expired runs and teacher tokens', async () => {
  const service = new ModeratedService(prisma);
  const lobby = await service.create(1, 'classic', 60);
  const active = await service.create(1, 'facilitated', 60);
  const ended = await service.create(1, 'classic', 60);
  const expired = await service.create(1, 'classic', 0);
  service.start(active.sessionId, active.facilitatorToken);
  service.end(ended.sessionId, ended.facilitatorToken);
  service.start(expired.sessionId, expired.facilitatorToken);
  const list = service.listActive();
  assert.deepEqual(list.map((session) => session.sessionId), [lobby.sessionId, active.sessionId]);
  assert.equal(list[0].phase, 'lobby');
  assert.equal(list[1].phase, 'question');
  assert.ok(list.every((session) => !('facilitatorToken' in session)));
});

test('homework listing distinguishes simultaneous runs and excludes ended or expired runs and teacher tokens', async () => {
  const service = new HomeworkService(prisma);
  const first = await service.create(1, 60);
  const second = await service.create(1, 60);
  const ended = await service.create(1, 60);
  await service.create(1, 0);
  service.join(first.sessionId, 'Student');
  service.end(ended.sessionId, ended.facilitatorToken);
  const list = service.listActive();
  assert.deepEqual(list.map((session) => session.sessionId), [first.sessionId, second.sessionId]);
  assert.equal(list[0].participantCount, 1);
  assert.ok(list.every (session => !('facilitatorToken' in session)));
});
