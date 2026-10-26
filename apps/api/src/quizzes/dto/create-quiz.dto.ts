import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const QUIZ_THEMES = ['standard', 'kids', 'christmas', 'halloween'] as const;
export type QuizTheme = typeof QUIZ_THEMES[number];

export const TIMER_SECONDS = [-1, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180] as const;

export class CreateQuizDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

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
}
