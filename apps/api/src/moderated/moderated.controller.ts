import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { FacilitatorActionDto, JoinModeratedSessionDto, SubmitModeratedAnswerDto, UpdateModeratedSettingsDto } from './dto/moderated-session.dto';
import { ModeratedService } from './moderated.service';

@Controller('moderated-sessions')
export class ModeratedController {
  constructor(private readonly moderatedService: ModeratedService) {}

  @Post('quiz/:quizId')
  create(@Param('quizId', ParseIntPipe) quizId: number) {
    return this.moderatedService.create(quizId);
  }

  @Post('pin/:pin/participants')
  join(
    @Param('pin') pin: string,
    @Body() body: JoinModeratedSessionDto,
  ) {
    return this.moderatedService.join(pin, body.name);
  }

  @Post('pin/:pin/answers')
  submitAnswer(
    @Param('pin') pin: string,
    @Body() body: SubmitModeratedAnswerDto,
  ) {
    return this.moderatedService.submitAnswer(pin, body);
  }

  @Get('pin/:pin')
  studentState(
    @Param('pin') pin: string,
    @Query('participantId') participantId?: string,
  ) {
    return this.moderatedService.studentState(pin, participantId);
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

  @Post(':sessionId/settings')
  updateSettings(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: UpdateModeratedSettingsDto,
  ) {
    return this.moderatedService.updateSettings(sessionId, body.facilitatorToken, body.autoAdvanceOnTimeout);
  }

  @Post(':sessionId/next')
  next(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: FacilitatorActionDto,
  ) {
    return this.moderatedService.next(sessionId, body.facilitatorToken);
  }

}
