import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export const QUESTION_TYPES = ['multiple_choice', 'true_false', 'matching'] as const;
export type GeneratedQuestionType = (typeof QUESTION_TYPES)[number];

export class GenerateQuizDto {
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsInt() @Min(1) @Max(100) questionCount!: number;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3) @ArrayUnique() @IsIn(QUESTION_TYPES, { each: true })
  questionTypes!: GeneratedQuestionType[];
  @IsInt() @Min(0) @Max(20) gameCount!: number;
}
