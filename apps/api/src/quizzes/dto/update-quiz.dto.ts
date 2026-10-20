import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateQuizDto {
  @IsOptional()
  @IsBoolean()
  randomizeQuestionOrder?: boolean;

  @IsOptional()
  @IsIn(['standard', 'kids'])
  theme?: 'standard' | 'kids';
}
