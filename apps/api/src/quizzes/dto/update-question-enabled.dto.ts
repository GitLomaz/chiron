import { IsBoolean } from 'class-validator';

export class UpdateQuestionEnabledDto {
  @IsBoolean()
  isEnabled!: boolean;
}
