import { IsArray, IsInt, IsOptional, IsPositive, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

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
}
