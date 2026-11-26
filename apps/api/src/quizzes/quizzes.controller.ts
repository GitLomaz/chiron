import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateAnswerPoolDto } from './dto/create-answer-pool.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { UpdateQuestionEnabledDto } from './dto/update-question-enabled.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { CreateTextDto } from './dto/create-text.dto';
import { QuizzesService } from './quizzes.service';
import { GoogleAuthGuard } from '../auth/google-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';

@Controller('quizzes')
@UseGuards(GoogleAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.quizzesService.findAll(user);
  }

  @Get('common-questions')
  findCommonQuestions(@CurrentUser() user: AuthUser) {
    return this.quizzesService.findCommonQuestions(user);
  }

  @Post('common-questions')
  createCommonQuestion(@Body() question: CreateQuestionDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.createCommonQuestion(question, user);
  }

  @Put('common-questions/:id')
  updateCommonQuestion(@Param('id', ParseIntPipe) id: number, @Body() question: CreateQuestionDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.updateCommonQuestion(id, question, user);
  }

  @Get('answer-pools')
  findAnswerPools(@CurrentUser() user: AuthUser) {
    return this.quizzesService.findAnswerPools(user);
  }

  @Post('answer-pools')
  createAnswerPool(@Body() pool: CreateAnswerPoolDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.createAnswerPool(pool, user);
  }

  @Put('answer-pools/:id')
  updateAnswerPool(@Param('id', ParseIntPipe) id: number, @Body() pool: CreateAnswerPoolDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.updateAnswerPool(id, pool, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.quizzesService.findOne(id, user);
  }

  @Post()
  create(@Body() createQuizDto: CreateQuizDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.create(createQuizDto, user);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateQuizDto: UpdateQuizDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.update(id, updateQuizDto, user);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.quizzesService.archive(id, user);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.quizzesService.restore(id, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.quizzesService.remove(id, user);
  }

  @Post(':id/questions')
  addQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() createQuestionDto: CreateQuestionDto, @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.addQuestion(id, createQuestionDto, user);
  }

  @Post(':id/games')
  addGame(
    @Param('id', ParseIntPipe) id: number,
    @Body() game: CreateGameDto, @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.addGame(id, game, user);
  }

  @Put(':id/games/:gameId')
  updateGame(
    @Param('id', ParseIntPipe) id: number,
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() game: CreateGameDto, @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.updateGame(id, gameId, game, user);
  }

  @Post(':id/texts')
  addText(@Param('id', ParseIntPipe) id: number, @Body() text: CreateTextDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.addText(id, text, user);
  }

  @Put(':id/texts/:textId')
  updateText(@Param('id', ParseIntPipe) id: number, @Param('textId', ParseIntPipe) textId: number, @Body() text: CreateTextDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.updateText(id, textId, text, user);
  }

  @Put(':id/questions/order')
  reorderQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Body() { questionIds }: ReorderQuestionsDto, @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.reorderQuestions(id, questionIds, user);
  }

  @Put(':id/questions/:questionId')
  updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() question: CreateQuestionDto, @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.updateQuestion(id, questionId, question, user);
  }

  @Patch(':id/questions/:questionId')
  updateQuestionEnabled(
    @Param('id', ParseIntPipe) id: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() { isEnabled }: UpdateQuestionEnabledDto, @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.updateQuestionEnabled(id, questionId, isEnabled, user);
  }

  @Delete(':id/items/:itemId')
  deleteItem(@Param('id', ParseIntPipe) id: number, @Param('itemId', ParseIntPipe) itemId: number, @CurrentUser() user: AuthUser) {
    return this.quizzesService.deleteItem(id, itemId, user);
  }

  @Post(':id/questions/common/:commonQuestionId')
  addCommonQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Param('commonQuestionId', ParseIntPipe) commonQuestionId: number, @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.addCommonQuestion(id, commonQuestionId, user);
  }

}
