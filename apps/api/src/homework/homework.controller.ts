import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CompleteHomeworkItemDto, CreateHomeworkSessionDto, EndHomeworkSessionDto, JoinHomeworkSessionDto, RestartHomeworkDto, ShootHomeworkArcheryDto, SubmitHomeworkAnswerDto, UpdateHomeworkDurationDto } from './dto/homework-session.dto';
import { HomeworkService } from './homework.service';

@Controller('homework-sessions')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Get()
  listActive() { return this.homeworkService.listActive(); }

  @Get('history')
  listHistory() { return this.homeworkService.listHistory(); }

  @Post('quiz/:quizId')
  create(@Param('quizId', ParseIntPipe) quizId: number, @Body() body: CreateHomeworkSessionDto) { return this.homeworkService.create(quizId, body.durationSeconds, body.mode); }

  @Post(':sessionId/participants')
  join(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: JoinHomeworkSessionDto) { return this.homeworkService.join(sessionId, body.name); }

  @Get(':sessionId')
  studentState(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Query('participantId') participantId?: string) { return this.homeworkService.studentState(sessionId, participantId); }

  @Get(':sessionId/participants/:participantId')
  teacherAttempt(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Param('participantId', new ParseUUIDPipe({ version: '4' })) participantId: string, @Query('token') token: string) { return this.homeworkService.teacherAttempt(sessionId, token, participantId); }

  @Post(':sessionId/answers')
  submitAnswer(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: SubmitHomeworkAnswerDto) { return this.homeworkService.submitAnswer(sessionId, body.participantId, body.questionId, body.answer); }

  @Post(':sessionId/items/complete')
  completeItem(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: CompleteHomeworkItemDto) { return this.homeworkService.completeItem(sessionId, body.participantId, body.questionId); }

  @Post(':sessionId/restart')
  restart(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: RestartHomeworkDto) { return this.homeworkService.restart(sessionId, body.participantId); }

  @Post(':sessionId/archery/shoot')
  shootArchery(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: ShootHomeworkArcheryDto) { return this.homeworkService.shootArchery(sessionId, body.participantId, body.x, body.y); }

  @Get(':sessionId/teacher')
  teacherState(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Query('token') token: string) { return this.homeworkService.teacherState(sessionId, token); }

  @Post(':sessionId/end')
  end(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: EndHomeworkSessionDto) { return this.homeworkService.end(sessionId, body.facilitatorToken); }

  @Post(':sessionId/duration')
  updateDuration(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Body() body: UpdateHomeworkDurationDto) { return this.homeworkService.updateDuration(sessionId, body.facilitatorToken, body.durationSeconds); }

  @Delete(':sessionId')
  remove(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string, @Query('token') token: string) { return this.homeworkService.remove(sessionId, token); }
}
