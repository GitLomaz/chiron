import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateGameDto {
  @IsIn(['coin_catch', 'match_pairs', 'tower_stack'])
  gameType!: 'coin_catch' | 'match_pairs' | 'tower_stack';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  text?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  durationSeconds?: number;
}
