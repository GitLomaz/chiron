import { IsBoolean, IsIn, IsInt, IsOptional } from 'class-validator';
import { TIMER_SECONDS } from './create-quiz.dto';

export class UpdateQuizDto {
  @IsOptional()
  @IsBoolean()
  randomizeQuestionOrder?: boolean;

  @IsOptional()
  @IsIn(['standard', 'kids'])
  theme?: 'standard' | 'kids';

  @IsOptional()
  @IsInt()
  @IsIn(TIMER_SECONDS)
  defaultTimerSeconds?: number;
}
