import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

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
