require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../src/moderated/moderated.service');
const { HomeworkService } = require('../src/homework/homework.service');
const pairs = [{ question: 'Cat', answer: 'Chat' }, { question: 'Dog', answer: 'Chien' }, { question: 'Bird', answer: 'Oiseau' }];
const quiz = { title: 'Test', description: null, theme: 'standard', defaultTimerSeconds: -1, randomizeQuestionOrder: false, questions: [
  { id: 1, text: 'Is this right?', itemType: 'question', gameType: null, gameDurationSeconds: null, options: { kind: 'true_false', statement: 'Cat = chat' }, correctAnswer: 'True', answerCount: null, timerSeconds: null },
  { id: 2, text: 'Match the words', itemType: 'question', gameType: null, gameDurationSeconds: null, options: { kind: 'matching', pairs }, correctAnswer: 'Matched', answerCount: null, timerSeconds: null },
] };
const prisma = { quiz: { findUnique: async () => quiz } };
test('homework records true/false and stops matching after three wrong attempts', async () => {
  const service = new HomeworkService(prisma);
  const run = await service.create(1, 300), student = service.join(run.sessionId, 'Student');
  const state = service.studentState(run.sessionId, student.participantId);
  assert.deepEqual(state.questions[0].options, ['True', 'False']);
  assert.equal(service.submitAnswer(run.sessionId, student.participantId, '1', 'True').isCorrect, true);
  assert.equal(service.submitAnswer(run.sessionId, student.participantId, '2', 'match:0:0').answered, false);
  for (let i = 0; i < 2; i++) assert.equal(service.submitAnswer(run.sessionId, student.participantId, '2', 'match:1:2').answered, false);
  const result = service.submitAnswer(run.sessionId, student.participantId, '2', 'match:1:2');
  assert.equal(result.answered, true); assert.equal(result.isCorrect, false); assert.equal(result.score.correct, 1);
  assert.deepEqual(result.matchProgress, { matched: [0], mistakes: 3 });
  assert.throws(() => service.submitAnswer(run.sessionId, student.participantId, '2', 'match:1:1'));
});
test('live facilitated matching records progress and a correct completion', async () => {
  const service = new ModeratedService(prisma), run = await service.create(1, 'facilitated', 300), student = service.join(run.pin, 'Student', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  service.submitAnswer(run.pin, { participantId: student.participantId, questionId: '1', answer: 'True' });
  service.next(run.sessionId, run.facilitatorToken);
  for (let i = 0; i < 2; i++) {
    const response = service.submitAnswer(run.pin, { participantId: student.participantId, questionId: '2', answer: `match:${i}:${i}` });
    assert.equal(response.answered, false);
  }
  const state = service.studentState(run.pin, student.participantId);
  assert.deepEqual(state.currentQuestion.matchProgress.matched, [0, 1]);
  assert.equal(service.submitAnswer(run.pin, { participantId: student.participantId, questionId: '2', answer: 'match:2:2' }).answered, true);
  assert.equal(service.studentState(run.pin, student.participantId).score.correct, 2);
});
test('quiz authoring stores the statement and validates matching pairs', async () => {
  const { QuizzesService } = require('../src/quizzes/quizzes.service');
  let stored;
  const prisma = { quiz: { findUnique: async () => ({ id: 1 }) }, question: { aggregate: async () => ({ _max: { position: null } }), create: async ({ data }) => (stored = data) } };
  const service = new QuizzesService(prisma);
  await service.addQuestion(1, { text: 'Translate', correctAnswer: 'False', questionType: 'true_false', statement: 'Cat means dog' });
  assert.deepEqual(stored.options, { kind: 'true_false', statement: 'Cat means dog' });
  await service.addQuestion(1, { text: 'Match', correctAnswer: 'Matched', questionType: 'matching', pairs });
  assert.deepEqual(stored.options, { kind: 'matching', pairs });
  await assert.rejects(service.addQuestion(1, { text: 'Match', correctAnswer: 'Matched', questionType: 'matching', pairs: [pairs[0], pairs[0]] }));
});

test('homework returns the final successful matching state', async () => {
  const service = new HomeworkService(prisma);
  const run = await service.create(1, 300), student = service.join(run.sessionId, 'Student');
  service.submitAnswer(run.sessionId, student.participantId, '2', 'match:0:0');
  service.submitAnswer(run.sessionId, student.participantId, '2', 'match:1:1');
  const result = service.submitAnswer(run.sessionId, student.participantId, '2', 'match:2:2');
  assert.equal(result.isCorrect, true);
  assert.deepEqual(result.matchProgress, { matched: [0, 1, 2], mistakes: 0 });
});
