import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  findAll() {
    return this.quizzesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.findOne(id);
  }

  @Post()
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizzesService.create(createQuizDto);
  }

  @Post(':id/questions')
  addQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.quizzesService.addQuestion(id, createQuestionDto);
  }
}
