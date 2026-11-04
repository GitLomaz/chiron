import { MatchPair, MatchProgress, matchSelection } from './matching';
export type SpecialQuestion = { kind: 'true_false'; statement: string } | { kind: 'matching'; pairs: MatchPair[] };
export function specialQuestion(value: unknown): SpecialQuestion | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Partial<SpecialQuestion>;
  if (data.kind === 'true_false' && typeof data.statement === 'string') return data as SpecialQuestion;
  if (data.kind === 'matching' && Array.isArray(data.pairs)) return data as SpecialQuestion;
  return null;
}
export function matchAttempt(pairs: MatchPair[], progress: MatchProgress | undefined, answer: string) {
  const parts = /^match:(\d+):(\d+)$/.exec(answer);
  if (!parts) return null;
  return matchSelection(pairs, progress ?? { matched: [], mistakes: 0 }, Number(parts[1]), Number(parts[2]));
}
