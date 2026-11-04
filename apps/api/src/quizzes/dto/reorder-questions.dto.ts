import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class ReorderQuestionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  questionIds!: number[];
}
