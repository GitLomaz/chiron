import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateAnswerPoolDto } from './dto/create-answer-pool.dto';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  findAll() {
    return this.quizzesService.findAll();
  }

  @Get('common-questions')
  findCommonQuestions() {
    return this.quizzesService.findCommonQuestions();
  }

  @Post('common-questions')
  createCommonQuestion(@Body() question: CreateQuestionDto) {
    return this.quizzesService.createCommonQuestion(question);
  }

  @Put('common-questions/:id')
  updateCommonQuestion(@Param('id', ParseIntPipe) id: number, @Body() question: CreateQuestionDto) {
    return this.quizzesService.updateCommonQuestion(id, question);
  }

  @Get('answer-pools')
  findAnswerPools() {
    return this.quizzesService.findAnswerPools();
  }

  @Post('answer-pools')
  createAnswerPool(@Body() pool: CreateAnswerPoolDto) {
    return this.quizzesService.createAnswerPool(pool);
  }

  @Put('answer-pools/:id')
  updateAnswerPool(@Param('id', ParseIntPipe) id: number, @Body() pool: CreateAnswerPoolDto) {
    return this.quizzesService.updateAnswerPool(id, pool);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.findOne(id);
  }

  @Post()
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizzesService.create(createQuizDto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizzesService.update(id, updateQuizDto);
  }

  @Post(':id/questions')
  addQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.quizzesService.addQuestion(id, createQuestionDto);
  }

  @Put(':id/questions/:questionId')
  updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() question: CreateQuestionDto,
  ) {
    return this.quizzesService.updateQuestion(id, questionId, question);
  }

  @Post(':id/questions/common/:commonQuestionId')
  addCommonQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Param('commonQuestionId', ParseIntPipe) commonQuestionId: number,
  ) {
    return this.quizzesService.addCommonQuestion(id, commonQuestionId);
  }

}
