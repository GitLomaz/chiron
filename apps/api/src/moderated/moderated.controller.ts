import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { FacilitatorActionDto, JoinModeratedSessionDto, SubmitModeratedAnswerDto } from './dto/moderated-session.dto';
import { ModeratedService } from './moderated.service';

@Controller('moderated-sessions')
export class ModeratedController {
  constructor(private readonly moderatedService: ModeratedService) {}

  @Post('quiz/:quizId')
  create(@Param('quizId', ParseIntPipe) quizId: number) {
    return this.moderatedService.create(quizId);
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

  @Post(':sessionId/next')
  next(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: FacilitatorActionDto,
  ) {
    return this.moderatedService.next(sessionId, body.facilitatorToken);
  }

  @Post(':sessionId/participants')
  join(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: JoinModeratedSessionDto,
  ) {
    return this.moderatedService.join(sessionId, body.name);
  }

  @Post(':sessionId/answers')
  submitAnswer(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: SubmitModeratedAnswerDto,
  ) {
    return this.moderatedService.submitAnswer(sessionId, body);
  }

  @Get(':sessionId')
  studentState(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Query('participantId') participantId?: string,
  ) {
    return this.moderatedService.studentState(sessionId, participantId);
  }
}
