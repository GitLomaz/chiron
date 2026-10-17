import { ArrayMinSize, IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  options!: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  correctAnswer!: string;
}
