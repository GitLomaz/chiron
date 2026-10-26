import { IsInt, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateHomeworkSessionDto {
  @IsInt()
  @Min(300)
  @Max(604800)
  durationSeconds!: number;
}

export class EndHomeworkSessionDto {
  @IsUUID('4')
  facilitatorToken!: string;
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
