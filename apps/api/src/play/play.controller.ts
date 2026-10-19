import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PlayService } from './play.service';

/**
 * Public, read-only quiz data used by the student player. Answers are scored
 * in the browser for now, so no attempt data is stored by this endpoint.
 */
@Controller('play')
export class PlayController {
  constructor(private readonly playService: PlayService) {}

  @Get(':guid')
  findQuiz(@Param('guid', new ParseUUIDPipe({ version: '4' })) guid: string) {
    return this.playService.findQuiz(guid);
  }
}
