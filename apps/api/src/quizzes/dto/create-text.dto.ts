import { MaxLength, MinLength, IsString } from 'class-validator';

export class CreateTextDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}
