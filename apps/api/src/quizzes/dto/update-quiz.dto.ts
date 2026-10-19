import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateQuizDto {
  @IsOptional()
  @IsBoolean()
  randomizeQuestionOrder?: boolean;
}
