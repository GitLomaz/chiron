import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateHomeworkSessionDto {
  @IsInt()
  @Min(300)
  @Max(604800)
  durationSeconds!: number;

  @IsOptional()
  @IsIn(['classic', 'archery'])
  mode?: 'classic' | 'archery';
}

export class EndHomeworkSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  facilitatorToken!: string;
}

export class UpdateHomeworkDurationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  facilitatorToken!: string;

  @IsInt()
  @Min(300)
  @Max(604800)
  durationSeconds!: number;
}

export class JoinHomeworkSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class SubmitHomeworkAnswerDto {
  @IsUUID('4')
  participantId!: string;

  @IsString()
  @MinLength(1)
  questionId!: string;

  @IsString()
  @MaxLength(500)
  answer!: string;
}

export class CompleteHomeworkItemDto {
  @IsUUID('4')
  participantId!: string;

  @IsString()
  @MinLength(1)
  questionId!: string;
}

export class RestartHomeworkDto {
  @IsUUID('4')
  participantId!: string;
}

export class ShootHomeworkArcheryDto {
  @IsUUID('4')
  participantId!: string;

  @IsNumber()
  @Min(-100)
  @Max(100)
  x!: number;

  @IsNumber()
  @Min(-100)
  @Max(100)
  y!: number;
}
