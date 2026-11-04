import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize, ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsPositive, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { TIMER_SECONDS } from './create-quiz.dto';

export class QuestionPairDto {
  @IsString() @MinLength(1) @MaxLength(500) question!: string;
  @IsString() @MinLength(1) @MaxLength(500) answer!: string;
}
export class CreateQuestionDto {
  @IsOptional() @IsIn(['multiple_choice', 'true_false', 'matching']) questionType?: 'multiple_choice' | 'true_false' | 'matching';
  @IsOptional() @IsString() @MaxLength(500) statement?: string;
  @IsOptional() @IsArray() @ArrayMinSize(2) @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => QuestionPairDto) pairs?: QuestionPairDto[];

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
