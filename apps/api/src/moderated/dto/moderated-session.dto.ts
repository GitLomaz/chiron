import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateModeratedSessionDto {
  @IsOptional()
  @IsIn(['classic', 'facilitated', 'matching'])
  mode?: 'classic' | 'facilitated' | 'matching';
}

export class JoinModeratedSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsUUID('4')
  clientId!: string;
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

export class UpdateLobbyLockDto extends FacilitatorActionDto {
  @IsBoolean()
  lobbyLocked!: boolean;
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

export class FlipMatchingCardDto {
  @IsUUID('4')
  participantId!: string;

  @IsInt()
  @Min(0)
  @Max(11)
  card!: number;
}

export class MatchingNextDto {
  @IsUUID('4')
  participantId!: string;
}
