import { IsBoolean, IsInt, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class JoinModeratedSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class SubmitModeratedAnswerDto {
  @IsUUID('4')
  participantId!: string;

  @IsString()
  @MinLength(1)
  questionId!: string;

  // The selected option is intentionally not returned to the facilitator.
  // It is retained in memory only so this can grow into scored attempts later.
  @IsString()
  @MaxLength(500)
  answer!: string;
}

export class FacilitatorActionDto {
  @IsUUID('4')
  facilitatorToken!: string;
}

export class UpdateModeratedSettingsDto extends FacilitatorActionDto {
  @IsBoolean()
  autoAdvanceOnTimeout!: boolean;
}

export class ReportModeratedGameScoreDto {
  @IsUUID('4')
  participantId!: string;

  @IsString()
  @MinLength(1)
  questionId!: string;

  @IsInt()
  @Min(0)
  @Max(10000)
  score!: number;
}
