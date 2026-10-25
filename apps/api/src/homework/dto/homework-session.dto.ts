import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

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
