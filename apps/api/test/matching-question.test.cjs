require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { matchSelection } = require('../src/question-types/matching');
const pairs = [{ question: 'one', answer: 'un' }, { question: 'two', answer: 'deux' }, { question: 'three', answer: 'trois' }];
test('matching retains correct pairs and ends after three mistakes', () => {
  let progress = { matched: [], mistakes: 0 };
  progress = matchSelection(pairs, progress, 0, 0);
  assert.deepEqual(progress, { matched: [0], mistakes: 0 });
  assert.throws(() => matchSelection(pairs, progress, 0, 1));
  for (let i = 0; i < 3; i++) progress = matchSelection(pairs, progress, 1, 2);
  assert.deepEqual(progress, { matched: [0], mistakes: 3 });
  assert.throws(() => matchSelection(pairs, progress, 1, 1));
});
test('matching rejects invalid indexes and stops after all pairs are found', () => {
  assert.throws(() => matchSelection(pairs, { matched: [], mistakes: 0 }, -1, 0));
  let progress = { matched: [], mistakes: 0 };
  for (let i = 0; i < pairs.length; i++) progress = matchSelection(pairs, progress, i, i);
  assert.throws(() => matchSelection(pairs, progress, 0, 0));
});
