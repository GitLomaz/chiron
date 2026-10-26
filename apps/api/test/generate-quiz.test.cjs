require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('class-validator');
const { GenerateQuizService } = require('../src/data-sets/generate-quiz.service');
const { GenerateQuizDto } = require('../src/data-sets/generate-quiz.dto');
const source = [{ question: 'cat', answer: 'chat' }, { question: 'dog', answer: 'chien' }, { question: 'bird', answer: 'oiseau' }, { question: 'fish', answer: 'poisson' }, { question: 'cat', answer: 'minou' }];
function setup(pairs = source) {
  let created;
  const prisma = { dataSet: { findUnique: async () => ({ name: 'French', pairs }) }, quiz: { create: async (args) => { created = args.data; return { id: 9, title: created.title }; } } };
  return { service: new GenerateQuizService(prisma), getCreated: () => created };
}
const input = { title: 'French quiz', questionCount: 9, questionTypes: ['multiple_choice', 'true_false', 'matching'], gameCount: 3 };
test('generates balanced playable questions with games and safe alternatives', async () => {
  const { service, getCreated } = setup();
  const quiz = await service.generate(1, input);
  assert.equal(quiz.id, 9);
  const items = getCreated().questions.create;
  assert.equal(items.length, 12);
  assert.deepEqual(items.map((item) => item.position), Array.from({ length: 12 }, (_, i) => i));
  assert.equal(items.filter((item) => item.itemType === 'game').length, 3);
  assert.ok(items.some((item, index) => item.itemType === 'game' && index < items.length - 1));
  const questions = items.filter((item) => item.itemType !== 'game');
  assert.equal(questions.filter((item) => Array.isArray(item.options)).length, 3);
  assert.equal(questions.filter((item) => item.options.kind === 'true_false').length, 3);
  assert.equal(questions.filter((item) => item.options.kind === 'matching').length, 3);
  for (const item of questions) {
    if (Array.isArray(item.options)) {
      assert.ok(item.options.includes(item.correctAnswer) && item.options.length >= 2);
      for (const wrong of item.options.filter((value) => value !== item.correctAnswer)) assert.ok(!source.some((pair) => pair.question === item.text && pair.answer === wrong));
    } else if (item.options.kind === 'true_false') {
      assert.equal(source.some((pair) => pair.question === item.text && pair.answer === item.options.statement), item.correctAnswer === 'True');
    } else {
      assert.ok(item.options.pairs.length >= 2 && item.options.pairs.length <= 4);
      assert.equal(new Set(item.options.pairs.map((pair) => pair.question)).size, item.options.pairs.length);
      assert.equal(new Set(item.options.pairs.map((pair) => pair.answer)).size, item.options.pairs.length);
    }
  }
});
test('rejects unusable sets before creating a quiz', async () => {
  const { service, getCreated } = setup([{ question: 'cat', answer: 'chat' }]);
  await assert.rejects(service.generate(1, { ...input, questionTypes: ['matching'] }), /Matching needs/);
  await assert.rejects(service.generate(1, { ...input, questionTypes: ['multiple_choice'] }), /Multiple choice needs/);
  assert.equal(getCreated(), undefined);
  await assert.rejects(service.generate(1, { ...input, questionCount: 2 }), /one question per/);
});
test('reuses a single pair for a true/false quiz', async () => {
  const { service, getCreated } = setup([{ question: 'cat', answer: 'chat' }]);
  await service.generate(1, { ...input, questionCount: 4, questionTypes: ['true_false'], gameCount: 0 });
  assert.equal(getCreated().questions.create.length, 4);
  assert.ok(getCreated().questions.create.every((question) => question.correctAnswer === 'True'));
});
test('validates counts and question types', async () => {
  for (const changes of [{ questionCount: 0 }, { gameCount: 21 }, { questionTypes: [] }, { questionTypes: ['matching', 'matching'] }, { questionTypes: ['other'] }]) assert.ok((await validate(Object.assign(new GenerateQuizDto(), input, changes))).length);
  assert.equal((await validate(Object.assign(new GenerateQuizDto(), input))).length, 0);
});
