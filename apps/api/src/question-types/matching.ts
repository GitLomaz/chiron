import { BadRequestException } from '@nestjs/common';

export type MatchPair = { question: string; answer: string };
export type MatchProgress = { matched: number[]; mistakes: number };

/** Applies one selection to a matching question. Pair indexes are stable within a run. */
export function matchSelection(pairs: MatchPair[], progress: MatchProgress, left: number, right: number): MatchProgress {
  if (progress.mistakes >= 3 || progress.matched.length === pairs.length) throw new BadRequestException('This matching question is already complete');
  if (!Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right < 0 || left >= pairs.length || right >= pairs.length) throw new BadRequestException('Choose a valid question and answer');
  if (progress.matched.includes(left) || progress.matched.includes(right)) throw new BadRequestException('Choose an unmatched question and answer');
  return left === right
    ? { matched: [...progress.matched, left], mistakes: progress.mistakes }
    : { matched: progress.matched, mistakes: progress.mistakes + 1 };
}
