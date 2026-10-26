import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CreateModeratedSessionDto, FacilitatorActionDto, FlipMatchingCardDto, JoinModeratedSessionDto, MatchingNextDto, ReportModeratedGameScoreDto, SubmitModeratedAnswerDto, UpdateLobbyLockDto } from './dto/moderated-session.dto';
import { ModeratedService } from './moderated.service';

@Controller('moderated-sessions')
export class ModeratedController {
  constructor(private readonly moderatedService: ModeratedService) {}

  @Post('quiz/:quizId')
  create(@Param('quizId', ParseIntPipe) quizId: number, @Body() body: CreateModeratedSessionDto) {
    return this.moderatedService.create(quizId, body?.mode);
  }

  @Post('pin/:pin/participants')
  join(
    @Param('pin') pin: string,
    @Body() body: JoinModeratedSessionDto,
  ) {
    return this.moderatedService.join(pin, body.name, body.clientId);
  }

  @Post('pin/:pin/answers')
  submitAnswer(
    @Param('pin') pin: string,
    @Body() body: SubmitModeratedAnswerDto,
  ) {
    return this.moderatedService.submitAnswer(pin, body);
  }

  @Post('pin/:pin/games/scores')
  reportGameScore(@Param('pin') pin: string, @Body() body: ReportModeratedGameScoreDto) {
    return this.moderatedService.reportGameScore(pin, body);
  }

  @Post('pin/:pin/matching/flip')
  flipMatchingCard(@Param('pin') pin: string, @Body() body: FlipMatchingCardDto) {
    return this.moderatedService.flipMatchingCard(pin, body.participantId, body.card);
  }

  @Post('pin/:pin/matching/next')
  nextMatchingQuestion(@Param('pin') pin: string, @Body() body: MatchingNextDto) {
    return this.moderatedService.nextMatchingQuestion(pin, body.participantId);
  }

  @Get('pin/:pin')
  studentState(
    @Param('pin') pin: string,
    @Query('participantId') participantId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.moderatedService.studentState(pin, participantId, clientId);
  }

  @Get(':sessionId/facilitator')
  facilitatorState(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Query('token') token: string,
  ) {
    return this.moderatedService.facilitatorState(sessionId, token);
  }

  @Post(':sessionId/start')
  start(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: FacilitatorActionDto,
  ) {
    return this.moderatedService.start(sessionId, body.facilitatorToken);
  }

  @Post(':sessionId/end')
  end(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: FacilitatorActionDto) {
    return this.moderatedService.end(sessionId, body.facilitatorToken);
  }

  @Post(':sessionId/next')
  next(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: FacilitatorActionDto) {
    return this.moderatedService.next(sessionId, body.facilitatorToken);
  }

  @Post(':sessionId/lobby')
  updateLobbyLock(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: UpdateLobbyLockDto,
  ) {
    return this.moderatedService.updateLobbyLock(sessionId, body.facilitatorToken, body.lobbyLocked);
  }

  @Post(':sessionId/participants/:participantId/remove')
  removeParticipant(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Param('participantId', new ParseUUIDPipe({ version: '4' })) participantId: string,
    @Body() body: FacilitatorActionDto,
  ) {
    return this.moderatedService.removeParticipant(sessionId, body.facilitatorToken, participantId);
  }

}
