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
