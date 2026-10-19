import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
  @IsIn(['standard', 'kids'])
  theme?: 'standard' | 'kids';
}
