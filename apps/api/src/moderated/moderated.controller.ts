import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { AdvanceModeratedQuestionDto, CreateModeratedSessionDto, FacilitatorActionDto, FlipMatchingCardDto, JoinModeratedSessionDto, MatchingNextDto, ReportModeratedGameScoreDto, RestartModeratedSessionDto, SubmitModeratedAnswerDto, UpdateLobbyLockDto, UpdatePresentationModeDto } from './dto/moderated-session.dto';
import { ModeratedService } from './moderated.service';

@Controller('moderated-sessions')
export class ModeratedController {
  constructor(private readonly moderatedService: ModeratedService) {}

  @Get()
  listActive() { return this.moderatedService.listActive(); }

  @Post('quiz/:quizId')
  create(@Param('quizId', ParseIntPipe) quizId: number, @Body() body: CreateModeratedSessionDto) {
    return this.moderatedService.create(quizId, body?.mode, body.durationSeconds, body.endless, body.scoringEnabled);
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

  @Post('pin/:pin/next')
  nextQuestion(@Param('pin') pin: string, @Body() body: AdvanceModeratedQuestionDto) {
    return this.moderatedService.nextQuestion(pin, body.participantId);
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

  @Post(':sessionId/restart')
  restart(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: RestartModeratedSessionDto) {
    return this.moderatedService.restart(sessionId, body.facilitatorToken, body.mode);
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

  @Post(':sessionId/presentation')
  updatePresentationMode(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: UpdatePresentationModeDto,
  ) {
    return this.moderatedService.updatePresentationMode(sessionId, body.facilitatorToken, body.presentationMode);
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
