require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { validate } = require('class-validator');
const { ModeratedService } = require('../src/moderated/moderated.service');
const { HomeworkService } = require('../src/homework/homework.service');
const { CreateModeratedSessionDto } = require('../src/moderated/dto/moderated-session.dto');
const { CreateHomeworkSessionDto } = require('../src/homework/dto/homework-session.dto');

const quiz = {
  title: 'Test', description: null, theme: 'standard', defaultTimerSeconds: -1,
  randomizeQuestionOrder: false,
  questions: [1, 2].map((id) => ({ id, text: `Question ${id}`, itemType: 'question', gameType: null, gameDurationSeconds: null, options: ['yes', 'no'], correctAnswer: 'yes', answerCount: 2, timerSeconds: null })),
};
const prisma = { quiz: { findUnique: async () => quiz } };

test('duration is required and limited to five minutes through seven days', async () => {
  for (const Dto of [CreateModeratedSessionDto, CreateHomeworkSessionDto]) {
    for (const value of [undefined, 299, 604801, 300.5]) {
      assert.ok((await validate(Object.assign(new Dto(), { durationSeconds: value }))).length);
    }
    for (const value of [300, 604800]) {
      assert.equal((await validate(Object.assign(new Dto(), { durationSeconds: value }))).length, 0);
    }
  }
});

test('live deadline begins at start and rejects late activity while retaining answers', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'classic', 300);
  const student = service.join(run.pin, 'Student', randomUUID());
  assert.equal(service.studentState(run.pin, student.participantId).endsAt, null);
  service.start(run.sessionId, run.facilitatorToken);
  service.submitAnswer(run.pin, { participantId: student.participantId, questionId: '1', answer: 'yes' });
  const endsAt = Date.parse(service.studentState(run.pin, student.participantId).endsAt);
  const originalNow = Date.now;
  try {
    Date.now = () => endsAt;
    const state = service.studentState(run.pin, student.participantId);
    assert.equal(state.expired, true);
    assert.equal(state.phase, 'complete');
    assert.deepEqual(state.score, { correct: 1, answered: 1 });
    assert.throws(() => service.submitAnswer(run.pin, { participantId: student.participantId, questionId: '1', answer: 'yes' }));
    assert.throws(() => service.join(run.pin, 'Late', randomUUID()));
  } finally { Date.now = originalNow; }
});

test('homework deadline rejects late activity while retaining answers', async () => {
  const service = new HomeworkService(prisma);
  const run = await service.create(1, 300);
  const student = service.join(run.sessionId, 'Student');
  service.submitAnswer(run.sessionId, student.participantId, '1', 'yes');
  const endsAt = Date.parse(service.studentState(run.sessionId, student.participantId).endsAt);
  const originalNow = Date.now;
  try {
    Date.now = () => endsAt;
    const state = service.studentState(run.sessionId, student.participantId);
    assert.equal(state.expired, true);
    assert.equal(state.ended, true);
    assert.equal(state.participant.score.correct, 1);
    assert.throws(() => service.submitAnswer(run.sessionId, student.participantId, '2', 'yes'));
    assert.throws(() => service.join(run.sessionId, 'Late'));
  } finally { Date.now = originalNow; }
});
