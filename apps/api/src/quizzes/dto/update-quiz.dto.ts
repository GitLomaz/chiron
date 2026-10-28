import { IsBoolean, IsIn, IsInt, IsOptional } from 'class-validator';
import { MATCHING_PAIR_COUNTS, QUIZ_THEMES, QuizTheme, TIMER_SECONDS } from './create-quiz.dto';

export class UpdateQuizDto {
  @IsOptional()
  @IsBoolean()
  randomizeQuestionOrder?: boolean;

  @IsOptional()
  @IsIn(QUIZ_THEMES)
  theme?: QuizTheme;

  @IsOptional()
  @IsInt()
  @IsIn(TIMER_SECONDS)
  defaultTimerSeconds?: number;

  @IsOptional()
  @IsInt()
  @IsIn(MATCHING_PAIR_COUNTS)
  matchingPairCount?: number;
}
