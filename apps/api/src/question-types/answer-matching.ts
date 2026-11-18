export const ANSWER_MATCHING_MODES = ['exact', 'close'] as const;
export type AnswerMatching = typeof ANSWER_MATCHING_MODES[number];

function closeAnswer(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[’‘`']/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function answersMatch(answer: string, correctAnswer: string, mode: AnswerMatching | string | undefined = 'close') {
  if (mode === 'exact') return answer.trim() === correctAnswer.trim();
  return closeAnswer(answer) === closeAnswer(correctAnswer);
}

/**
 * Speech recognition can occasionally include a student's immediate retry in
 * the same transcript (for example, "pret pret"). Treat only complete,
 * consecutive repetitions of the expected phrase as an answer match.
 */
export function repeatedAnswerMatch(answer: string, correctAnswer: string, mode: AnswerMatching | string | undefined = 'close') {
  const normalize = mode === 'exact'
    ? (value: string) => value.trim().replace(/\s+/gu, ' ')
    : closeAnswer;
  const actual = normalize(answer).split(' ').filter(Boolean);
  const expected = normalize(correctAnswer).split(' ').filter(Boolean);

  if (!expected.length || actual.length <= expected.length || actual.length % expected.length !== 0) return false;
  return actual.every((word, index) => word === expected[index % expected.length]);
}

/**
 * A student can naturally add a lead-in or a synonym while speaking (for
 * example, "vite rapide" for "rapide"). In speaking mode, accept the
 * authored answer only when it occurs as a complete, consecutive phrase.
 */
export function spokenAnswerMatch(answer: string, correctAnswer: string, mode: AnswerMatching | string | undefined = 'close') {
  if (answersMatch(answer, correctAnswer, mode)) return true;
  const normalize = mode === 'exact'
    ? (value: string) => value.trim().replace(/\s+/gu, ' ')
    : closeAnswer;
  const actual = normalize(answer).split(' ').filter(Boolean);
  const expected = normalize(correctAnswer).split(' ').filter(Boolean);

  if (!expected.length || actual.length < expected.length) return false;
  return actual.some((_, start) => expected.every((word, index) => actual[start + index] === word));
}
