import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateModeratedSessionDto {
  @IsInt()
  @Min(300)
  @Max(604800)
  durationSeconds!: number;

  @IsOptional()
  @IsIn(['classic', 'facilitated', 'matching', 'battleship', 'treasure_map', 'archery'])
  mode?: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery';

  @IsOptional()
  @IsBoolean()
  endless?: boolean;

  @IsOptional()
  @IsBoolean()
  scoringEnabled?: boolean;
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

export class UpdatePresentationModeDto extends FacilitatorActionDto {
  @IsIn(['scores', 'matching', 'battleship', 'treasure_map', 'archery'])
  presentationMode!: 'scores' | 'matching' | 'battleship' | 'treasure_map' | 'archery';
}

export class RestartModeratedSessionDto extends FacilitatorActionDto {
  @IsIn(['classic', 'facilitated', 'matching', 'battleship', 'treasure_map', 'archery'])
  mode!: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery';
}

export class UpdateBoardAutoResetDto extends FacilitatorActionDto {
  @IsBoolean()
  autoBoardReset!: boolean;
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

export class BattleshipAttackDto {
  @IsUUID('4')
  participantId!: string;

  @IsInt()
  @Min(0)
  @Max(99)
  cell!: number;
}

export class BattleshipNextDto {
  @IsUUID('4')
  participantId!: string;
}

export class ArcheryShotDto {
  @IsUUID('4')
  participantId!: string;

  @IsInt()
  @Min(-100)
  @Max(100)
  x!: number;

  @IsInt()
  @Min(-100)
  @Max(100)
  y!: number;
}

export class ArcheryNextDto {
  @IsUUID('4')
  participantId!: string;
}

export class TreasureMapDigDto {
  @IsUUID('4')
  participantId!: string;

  @IsInt()
  @Min(0)
  @Max(195)
  cell!: number;
}

export class TreasureMapNextDto {
  @IsUUID('4')
  participantId!: string;
}

export class AdvanceModeratedQuestionDto {
  @IsUUID('4')
  participantId!: string;
}
