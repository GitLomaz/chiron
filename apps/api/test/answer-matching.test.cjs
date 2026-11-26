const { test } = require('node:test');
const assert = require('node:assert/strict');
const { repeatedAnswerMatch, spokenAnswerMatch } = require('../dist/question-types/answer-matching');

test('repeated spoken answers accept complete repeated words and phrases', () => {
  assert.equal(repeatedAnswerMatch('pret pret', 'pret'), true);
  assert.equal(repeatedAnswerMatch('je suis je suis', 'je suis'), true);
  assert.equal(repeatedAnswerMatch('Pret pret', 'pret'), true);
});

test('repeated spoken answers reject partial or interrupted repetitions', () => {
  assert.equal(repeatedAnswerMatch('pret', 'pret'), false);
  assert.equal(repeatedAnswerMatch('pret presque pret', 'pret'), false);
  assert.equal(repeatedAnswerMatch('je suis je', 'je suis'), false);
});

test('spoken answers accept complete expected phrases in a longer transcript', () => {
  assert.equal(spokenAnswerMatch('vite rapide', 'rapide'), true);
  assert.equal(spokenAnswerMatch('the train rapide today', 'train rapide'), true);
  assert.equal(spokenAnswerMatch('rapidement', 'rapide'), false);
});
