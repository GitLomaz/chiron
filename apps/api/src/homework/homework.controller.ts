import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CompleteHomeworkItemDto, CreateHomeworkSessionDto, EndHomeworkSessionDto, JoinHomeworkSessionDto, ReleaseHomeworkCurlingDto, RestartHomeworkDto, ShootHomeworkArcheryDto, SubmitHomeworkAnswerDto, UpdateHomeworkDurationDto } from './dto/homework-session.dto';
import { HomeworkService } from './homework.service';
import { GoogleAuthGuard } from '../auth/google-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';

@Controller('homework-sessions')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  listActive(@CurrentUser() user: AuthUser) { return this.homeworkService.listActive(user); }

  @Get('history')
  @UseGuards(GoogleAuthGuard)
  listHistory(@CurrentUser() user: AuthUser) { return this.homeworkService.listHistory(user); }

  @Post('quiz/:quizId')
  @UseGuards(GoogleAuthGuard)
  create(@Param('quizId', ParseIntPipe) quizId: number, @Body() body: CreateHomeworkSessionDto, @CurrentUser() user: AuthUser) { return this.homeworkService.create(quizId, body.durationSeconds, body.mode, user); }

  @Post(':sessionId/participants')
  join(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: JoinHomeworkSessionDto) { return this.homeworkService.join(sessionId, body.name); }

  @Get(':sessionId')
  studentState(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Query('participantId') participantId?: string) { return this.homeworkService.studentState(sessionId, participantId); }

  @Get(':sessionId/participants/:participantId')
  @UseGuards(GoogleAuthGuard)
  teacherAttempt(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Param('participantId', new ParseUUIDPipe({ version: '4' })) participantId: string, @CurrentUser() user: AuthUser) { return this.homeworkService.teacherAttempt(sessionId, user, participantId); }

  @Post(':sessionId/answers')
  submitAnswer(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: SubmitHomeworkAnswerDto) { return this.homeworkService.submitAnswer(sessionId, body.participantId, body.questionId, body.answer); }

  @Post(':sessionId/items/complete')
  completeItem(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: CompleteHomeworkItemDto) { return this.homeworkService.completeItem(sessionId, body.participantId, body.questionId); }

  @Post(':sessionId/restart')
  restart(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: RestartHomeworkDto) { return this.homeworkService.restart(sessionId, body.participantId); }

  @Post(':sessionId/archery/shoot')
  shootArchery(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: ShootHomeworkArcheryDto) { return this.homeworkService.shootArchery(sessionId, body.participantId, body.x, body.y); }

  @Post(':sessionId/curling/release')
  releaseCurling(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: ReleaseHomeworkCurlingDto) { return this.homeworkService.releaseCurlingStone(sessionId, body.participantId, body.direction, body.speed); }

  @Get(':sessionId/teacher')
  @UseGuards(GoogleAuthGuard)
  teacherState(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @CurrentUser() user: AuthUser) { return this.homeworkService.teacherState(sessionId, user); }

  @Post(':sessionId/end')
  @UseGuards(GoogleAuthGuard)
  end(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() _: EndHomeworkSessionDto, @CurrentUser() user: AuthUser) { return this.homeworkService.end(sessionId, user); }

  @Post(':sessionId/duration')
  @UseGuards(GoogleAuthGuard)
  updateDuration(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: UpdateHomeworkDurationDto, @CurrentUser() user: AuthUser) { return this.homeworkService.updateDuration(sessionId, user, body.durationSeconds); }

  @Delete(':sessionId')
  @UseGuards(GoogleAuthGuard)
  remove(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @CurrentUser() user: AuthUser) { return this.homeworkService.remove(sessionId, user); }
}
