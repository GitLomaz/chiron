import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateModeratedSessionDto {
  @IsInt()
  @Min(60)
  @Max(604800)
  durationSeconds!: number;

  @IsOptional()
  @IsIn(['classic', 'facilitated', 'matching', 'battleship', 'treasure_map', 'archery', 'curling', 'simon', 'snakes_ladders'])
  mode?: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery' | 'curling' | 'simon' | 'snakes_ladders';

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
  // Google ID tokens used by pre-authentication clients were sent in the
  // request body. Authentication now comes exclusively from Authorization,
  // but tolerate that legacy field during a rolling frontend deployment.
  @IsOptional()
  @IsString()
  @MaxLength(8192)
  facilitatorToken?: string;
}

export class UpdateLobbyLockDto extends FacilitatorActionDto {
  @IsBoolean()
  lobbyLocked!: boolean;
}

export class UpdatePresentationModeDto extends FacilitatorActionDto {
  @IsIn(['scores', 'matching', 'matching_leaderboard', 'battleship', 'battleship_leaderboard', 'treasure_map', 'treasure_map_leaderboard', 'archery', 'archery_leaderboard', 'curling', 'curling_leaderboard', 'simon', 'snakes_ladders', 'snakes_ladders_leaderboard'])
  presentationMode!: 'scores' | 'matching' | 'matching_leaderboard' | 'battleship' | 'battleship_leaderboard' | 'treasure_map' | 'treasure_map_leaderboard' | 'archery' | 'archery_leaderboard' | 'curling' | 'curling_leaderboard' | 'simon' | 'snakes_ladders' | 'snakes_ladders_leaderboard';
}

export class RestartModeratedSessionDto extends FacilitatorActionDto {
  @IsIn(['classic', 'facilitated', 'matching', 'battleship', 'treasure_map', 'archery', 'curling', 'simon', 'snakes_ladders'])
  mode!: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery' | 'curling' | 'simon' | 'snakes_ladders';
}

export class UpdateBoardAutoResetDto extends FacilitatorActionDto {
  @IsBoolean()
  autoBoardReset!: boolean;
}

export class UpdateModeratedDurationDto extends FacilitatorActionDto {
  @IsInt()
  @Min(60)
  @Max(604800)
  durationSeconds!: number;
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
  @Max(99)
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

export class CurlingReleaseDto {
  @IsUUID('4')
  participantId!: string;

  // -100 is hard left, 0 is straight, and 100 is hard right.
  @IsInt()
  @Min(-100)
  @Max(100)
  direction!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  speed!: number;
}

export class CurlingNextDto {
  @IsUUID('4')
  participantId!: string;
}

export class SimonStartDto {
  @IsUUID('4')
  participantId!: string;
}

export class SimonColorDto {
  @IsUUID('4')
  participantId!: string;

  @IsInt()
  @Min(0)
  @Max(5)
  color!: number;
}

export class SimonNextDto {
  @IsUUID('4')
  participantId!: string;
}

export class SnakesLaddersRollDto {
  @IsUUID('4')
  participantId!: string;
}

export class SnakesLaddersNextDto {
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
