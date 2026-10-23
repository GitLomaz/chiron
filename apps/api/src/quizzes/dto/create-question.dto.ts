import { IsArray, IsIn, IsInt, IsOptional, IsPositive, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { TIMER_SECONDS } from './create-quiz.dto';

export class CreateQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  wrongAnswers?: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  correctAnswer!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  answerPoolId?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(500)
  answerCount?: number;

  @IsOptional()
  @IsInt()
  @IsIn(TIMER_SECONDS)
  timerSeconds?: number | null;
}
