import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AdvanceModeratedQuestionDto, ArcheryNextDto, ArcheryShotDto, BattleshipAttackDto, BattleshipNextDto, CreateModeratedSessionDto, CurlingNextDto, CurlingReleaseDto, FacilitatorActionDto, FlipMatchingCardDto, JoinModeratedSessionDto, MatchingNextDto, ReportModeratedGameScoreDto, RestartModeratedSessionDto, SimonColorDto, SimonNextDto, SimonStartDto, SnakesLaddersNextDto, SnakesLaddersRollDto, SubmitModeratedAnswerDto, UpdateBoardAutoResetDto, UpdateLobbyLockDto, UpdateModeratedDurationDto, UpdatePresentationModeDto } from './dto/moderated-session.dto';
import { ModeratedService } from './moderated.service';
import { GoogleAuthGuard } from '../auth/google-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';

@Controller('moderated-sessions')
export class ModeratedController {
  constructor(private readonly moderatedService: ModeratedService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  listActive(@CurrentUser() user: AuthUser) { return this.moderatedService.listActive(user); }

  @Post('quiz/:quizId')
  @UseGuards(GoogleAuthGuard)
  create(@Param('quizId', ParseIntPipe) quizId: number, @Body() body: CreateModeratedSessionDto, @CurrentUser() user: AuthUser) {
    return this.moderatedService.create(quizId, body?.mode, body.durationSeconds, body.endless, body.scoringEnabled, user);
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

  @Post('pin/:pin/battleship/attack')
  attackBattleship(@Param('pin') pin: string, @Body() body: BattleshipAttackDto) {
    return this.moderatedService.attackBattleship(pin, body.participantId, body.cell);
  }

  @Post('pin/:pin/battleship/next')
  nextBattleshipQuestion(@Param('pin') pin: string, @Body() body: BattleshipNextDto) {
    return this.moderatedService.nextBattleshipQuestion(pin, body.participantId);
  }

  @Post('pin/:pin/archery/shoot')
  shootArchery(@Param('pin') pin: string, @Body() body: ArcheryShotDto) {
    return this.moderatedService.shootArchery(pin, body.participantId, body.x, body.y);
  }

  @Post('pin/:pin/archery/next')
  nextArcheryQuestion(@Param('pin') pin: string, @Body() body: ArcheryNextDto) {
    return this.moderatedService.nextArcheryQuestion(pin, body.participantId);
  }

  @Post('pin/:pin/curling/release')
  releaseCurlingStone(@Param('pin') pin: string, @Body() body: CurlingReleaseDto) {
    return this.moderatedService.releaseCurlingStone(pin, body.participantId, body.direction, body.speed);
  }

  @Post('pin/:pin/curling/next')
  nextCurlingQuestion(@Param('pin') pin: string, @Body() body: CurlingNextDto) {
    return this.moderatedService.nextCurlingQuestion(pin, body.participantId);
  }

  @Post('pin/:pin/simon/start')
  startSimon(@Param('pin') pin: string, @Body() body: SimonStartDto) {
    return this.moderatedService.startSimon(pin, body.participantId);
  }

  @Post('pin/:pin/simon/input')
  playSimonColor(@Param('pin') pin: string, @Body() body: SimonColorDto) {
    return this.moderatedService.playSimonColor(pin, body.participantId, body.color);
  }

  @Post('pin/:pin/simon/next')
  nextSimonQuestion(@Param('pin') pin: string, @Body() body: SimonNextDto) {
    return this.moderatedService.nextSimonQuestion(pin, body.participantId);
  }

  @Post('pin/:pin/snakes-ladders/roll')
  rollSnakesLadders(@Param('pin') pin: string, @Body() body: SnakesLaddersRollDto) {
    return this.moderatedService.rollSnakesLadders(pin, body.participantId);
  }

  @Post('pin/:pin/snakes-ladders/next')
  nextSnakesLaddersQuestion(@Param('pin') pin: string, @Body() body: SnakesLaddersNextDto) {
    return this.moderatedService.nextSnakesLaddersQuestion(pin, body.participantId);
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
  @UseGuards(GoogleAuthGuard)
  facilitatorState(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.moderatedService.facilitatorState(sessionId, user);
  }

  @Post(':sessionId/start')
  @UseGuards(GoogleAuthGuard)
  start(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() _: FacilitatorActionDto, @CurrentUser() user: AuthUser,
  ) {
    return this.moderatedService.start(sessionId, user);
  }

  @Post(':sessionId/end')
  @UseGuards(GoogleAuthGuard)
  end(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() _: FacilitatorActionDto, @CurrentUser() user: AuthUser) {
    return this.moderatedService.end(sessionId, user);
  }

  @Post(':sessionId/duration')
  @UseGuards(GoogleAuthGuard)
  updateDuration(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: UpdateModeratedDurationDto, @CurrentUser() user: AuthUser) {
    return this.moderatedService.updateDuration(sessionId, user, body.durationSeconds);
  }

  @Post(':sessionId/restart')
  @UseGuards(GoogleAuthGuard)
  restart(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: RestartModeratedSessionDto, @CurrentUser() user: AuthUser) {
    return this.moderatedService.restart(sessionId, user, body.mode);
  }

  @Post(':sessionId/board/reset')
  @UseGuards(GoogleAuthGuard)
  resetBoard(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() _: FacilitatorActionDto, @CurrentUser() user: AuthUser) {
    return this.moderatedService.resetBoard(sessionId, user);
  }

  @Post(':sessionId/board/auto-reset')
  @UseGuards(GoogleAuthGuard)
  updateBoardAutoReset(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: UpdateBoardAutoResetDto, @CurrentUser() user: AuthUser) {
    return this.moderatedService.updateBoardAutoReset(sessionId, user, body.autoBoardReset);
  }

  @Post(':sessionId/next')
  @UseGuards(GoogleAuthGuard)
  next(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() _: FacilitatorActionDto, @CurrentUser() user: AuthUser) {
    return this.moderatedService.next(sessionId, user);
  }

  @Post(':sessionId/lobby')
  @UseGuards(GoogleAuthGuard)
  updateLobbyLock(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: UpdateLobbyLockDto, @CurrentUser() user: AuthUser,
  ) {
    return this.moderatedService.updateLobbyLock(sessionId, user, body.lobbyLocked);
  }

  @Post(':sessionId/presentation')
  @UseGuards(GoogleAuthGuard)
  updatePresentationMode(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: UpdatePresentationModeDto, @CurrentUser() user: AuthUser,
  ) {
    return this.moderatedService.updatePresentationMode(sessionId, user, body.presentationMode);
  }

  @Post(':sessionId/participants/:participantId/remove')
  @UseGuards(GoogleAuthGuard)
  removeParticipant(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Param('participantId', new ParseUUIDPipe({ version: '4' })) participantId: string,
    @Body() _: FacilitatorActionDto, @CurrentUser() user: AuthUser,
  ) {
    return this.moderatedService.removeParticipant(sessionId, user, participantId);
  }

}
