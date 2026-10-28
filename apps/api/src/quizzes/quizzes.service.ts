import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateAnswerPoolDto } from './dto/create-answer-pool.dto';
import { CreateGameDto } from './dto/create-game.dto';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    });
  }

  async findOne(id: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: { answerPool: { select: { name: true } } },
        },
      },
    });

    if (!quiz) throw new NotFoundException(`Quiz ${id} was not found`);
    return quiz;
  }

  create({ title, description, randomizeQuestionOrder, theme, defaultTimerSeconds, matchingPairCount }: CreateQuizDto) {
    if (!title.trim()) {
      throw new BadRequestException('title cannot be blank');
    }

    return this.prisma.quiz.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        randomizeQuestionOrder: randomizeQuestionOrder ?? false,
        theme: theme ?? 'standard',
        defaultTimerSeconds: defaultTimerSeconds ?? -1,
        matchingPairCount: matchingPairCount ?? 6,
      },
    });
  }

  async update(id: number, { randomizeQuestionOrder, theme, defaultTimerSeconds, matchingPairCount }: UpdateQuizDto) {
    await this.findOne(id);
    return this.prisma.quiz.update({
      where: { id },
      data: { randomizeQuestionOrder, theme, defaultTimerSeconds, matchingPairCount },
    });
  }

  async addQuestion(quizId: number, question: CreateQuestionDto) {
    await this.findOne(quizId);
    const { text, correctAnswer, options, answerPoolId, answerCount } = await this.prepareQuestion(question);
    const { _max } = await this.prisma.question.aggregate({ where: { quizId }, _max: { position: true } });

    return this.prisma.question.create({
      data: {
        quizId,
        position: (_max.position ?? -1) + 1,
        text,
        options: options as Prisma.InputJsonValue,
        correctAnswer,
        answerPoolId,
        answerCount,
        timerSeconds: question.timerSeconds ?? null,
      },
    });
  }

  async addGame(quizId: number, game: CreateGameDto) {
    await this.findOne(quizId);
    const { _max } = await this.prisma.question.aggregate({ where: { quizId }, _max: { position: true } });
    const text = game.text?.trim() || this.gameTitle(game.gameType);
    return this.prisma.question.create({
      data: {
        quizId,
        position: (_max.position ?? -1) + 1,
        itemType: 'game',
        gameType: game.gameType,
        gameDurationSeconds: game.durationSeconds ?? 20,
        text,
        // These required legacy fields are deliberately unused by game items.
        correctAnswer: '',
        options: [],
      },
    });
  }

  async updateGame(quizId: number, gameId: number, game: CreateGameDto) {
    const existing = await this.prisma.question.findFirst({ where: { id: gameId, quizId, itemType: 'game' } });
    if (!existing) throw new NotFoundException(`Game ${gameId} was not found in quiz ${quizId}`);
    return this.prisma.question.update({
      where: { id: gameId },
      data: {
        text: game.text?.trim() || this.gameTitle(game.gameType),
        gameType: game.gameType,
        gameDurationSeconds: game.durationSeconds ?? existing.gameDurationSeconds ?? 20,
      },
    });
  }

  async updateQuestion(quizId: number, questionId: number, question: CreateQuestionDto) {
    const existing = await this.prisma.question.findFirst({ where: { id: questionId, quizId } });
    if (!existing) throw new NotFoundException(`Question ${questionId} was not found in quiz ${quizId}`);
    const { text, correctAnswer, options, answerPoolId, answerCount } = await this.prepareQuestion(question);
    return this.prisma.question.update({
      where: { id: questionId },
      data: { text, correctAnswer, options: options as Prisma.InputJsonValue, answerPoolId, answerCount, timerSeconds: question.timerSeconds ?? null },
    });
  }

  async updateQuestionEnabled(quizId: number, questionId: number, isEnabled: boolean) {
    const existing = await this.prisma.question.findFirst({ where: { id: questionId, quizId } });
    if (!existing) throw new NotFoundException(`Question ${questionId} was not found in quiz ${quizId}`);
    await this.prisma.question.update({ where: { id: questionId }, data: { isEnabled } });
    return this.findOne(quizId);
  }

  async reorderQuestions(quizId: number, questionIds: number[]) {
    const questions = await this.prisma.question.findMany({ where: { quizId }, select: { id: true } });
    const existingIds = new Set(questions.map((question) => question.id));
    const requestedIds = new Set(questionIds);
    if (requestedIds.size !== questionIds.length || requestedIds.size !== existingIds.size || [...requestedIds].some((id) => !existingIds.has(id))) {
      throw new BadRequestException('Question order must contain every question in this quiz exactly once');
    }

    await this.prisma.$transaction(questionIds.map((questionId, position) => this.prisma.question.update({ where: { id: questionId }, data: { position } })));
    return this.findOne(quizId);
  }

  findCommonQuestions() {
    return this.prisma.commonQuestion.findMany({
      orderBy: { createdAt: 'desc' },
      include: { answerPool: { include: { answers: { orderBy: { value: 'asc' } } } } },
    });
  }

  async createCommonQuestion(question: CreateQuestionDto) {
    const { text, correctAnswer, options, answerPoolId, answerCount } = await this.prepareQuestion(question);
    return this.prisma.commonQuestion.create({
      data: { text, correctAnswer, options: options as Prisma.InputJsonValue, answerPoolId, answerCount },
      include: { answerPool: { include: { answers: true } } },
    });
  }

  async updateCommonQuestion(id: number, question: CreateQuestionDto) {
    const existing = await this.prisma.commonQuestion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Common question ${id} was not found`);
    const { text, correctAnswer, options, answerPoolId, answerCount } = await this.prepareQuestion(question);
    return this.prisma.commonQuestion.update({
      where: { id },
      data: { text, correctAnswer, options: options as Prisma.InputJsonValue, answerPoolId, answerCount },
      include: { answerPool: { include: { answers: true } } },
    });
  }

  findAnswerPools() {
    return this.prisma.answerPool.findMany({
      orderBy: { name: 'asc' },
      include: { answers: { orderBy: { value: 'asc' } }, _count: { select: { questions: true, commonQuestions: true } } },
    });
  }

  async createAnswerPool(pool: CreateAnswerPoolDto) {
    const name = pool.name.trim();
    const answers = this.cleanUnique(pool.answers);
    if (!name || !answers.length) throw new BadRequestException('A pool name and at least one answer are required');
    return this.prisma.answerPool.create({
      data: { name, answers: { create: answers.map((value) => ({ value })) } },
      include: { answers: true, _count: { select: { questions: true, commonQuestions: true } } },
    });
  }

  async updateAnswerPool(id: number, pool: CreateAnswerPoolDto) {
    const name = pool.name.trim();
    const answers = this.cleanUnique(pool.answers);
    if (!name || !answers.length) throw new BadRequestException('A pool name and at least one answer are required');
    const existing = await this.prisma.answerPool.findUnique({
      where: { id },
      include: {
        questions: { select: { correctAnswer: true, answerCount: true } },
        commonQuestions: { select: { correctAnswer: true, answerCount: true } },
      },
    });
    if (!existing) throw new NotFoundException(`Answer pool ${id} was not found`);
    const invalidQuestion = [...existing.questions, ...existing.commonQuestions].find((question) => {
      if (!question.answerCount) return false;
      const availableAnswers = answers.includes(question.correctAnswer) ? answers.length : answers.length + 1;
      return question.answerCount > availableAnswers;
    });
    if (invalidQuestion) {
      throw new BadRequestException('This pool would not contain enough answers for a question that already uses it');
    }
    return this.prisma.answerPool.update({
      where: { id },
      data: { name, answers: { deleteMany: {}, create: answers.map((value) => ({ value })) } },
      include: { answers: { orderBy: { value: 'asc' } }, _count: { select: { questions: true, commonQuestions: true } } },
    });
  }

  async addCommonQuestion(quizId: number, commonQuestionId: number) {
    await this.findOne(quizId);
    const commonQuestion = await this.prisma.commonQuestion.findUnique({ where: { id: commonQuestionId } });
    if (!commonQuestion) throw new NotFoundException(`Common question ${commonQuestionId} was not found`);
    const { _max } = await this.prisma.question.aggregate({ where: { quizId }, _max: { position: true } });
    return this.prisma.question.create({
      data: {
        quizId,
        position: (_max.position ?? -1) + 1,
        text: commonQuestion.text,
        options: commonQuestion.options as Prisma.InputJsonValue,
        correctAnswer: commonQuestion.correctAnswer,
        answerPoolId: commonQuestion.answerPoolId,
        answerCount: commonQuestion.answerCount,
        timerSeconds: null,
      },
    });
  }

  private async prepareQuestion(question: CreateQuestionDto) {
    const text = question.text.trim();
    const correctAnswer = question.correctAnswer.trim();
    if (!text || !correctAnswer) throw new BadRequestException('Question text and the correct answer cannot be blank');

    if (question.questionType === 'true_false') {
      const statement = question.statement?.trim();
      if (!statement || !['True', 'False'].includes(correctAnswer)) throw new BadRequestException('Enter an answer and select True or False');
      return { text, correctAnswer, options: { kind: 'true_false', statement }, answerPoolId: null, answerCount: null };
    }
    if (question.questionType === 'matching') {
      const pairs = question.pairs?.map((pair) => ({ question: pair.question.trim(), answer: pair.answer.trim() })) ?? [];
      if (pairs.length < 2 || pairs.some((pair) => !pair.question || !pair.answer)) throw new BadRequestException('Provide at least two complete pairs');
      if (new Set(pairs.map((pair) => pair.question)).size !== pairs.length || new Set(pairs.map((pair) => pair.answer)).size !== pairs.length) throw new BadRequestException('Questions and answers must be unique within a matching question');
      return { text, correctAnswer: 'Matched', options: { kind: 'matching', pairs }, answerPoolId: null, answerCount: null };
    }

    let wrongAnswers = this.cleanUnique(question.wrongAnswers ?? []).filter((answer) => answer !== correctAnswer);
    let answerCount: number | null = null;
    if (question.answerPoolId) {
      const pool = await this.prisma.answerPool.findUnique({
        where: { id: question.answerPoolId }, include: { answers: true },
      });
      if (!pool) throw new NotFoundException(`Answer pool ${question.answerPoolId} was not found`);
      wrongAnswers = pool.answers.map((answer) => answer.value).filter((answer) => answer !== correctAnswer);
      if (!question.answerCount) throw new BadRequestException('Number of answers shown is required when using an answer pool');
      if (question.answerCount > wrongAnswers.length + 1) {
        throw new BadRequestException(`Number of answers shown cannot exceed ${wrongAnswers.length + 1} for this answer pool`);
      }
      answerCount = question.answerCount;
    }
    if (wrongAnswers.length < 1) throw new BadRequestException('Provide at least one wrong answer or select an answer pool');
    return { text, correctAnswer, options: this.cleanUnique([correctAnswer, ...wrongAnswers]), answerPoolId: question.answerPoolId, answerCount };
  }

  private cleanUnique(values: string[]) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }

  private gameTitle(gameType: CreateGameDto['gameType']) {
    if (gameType === 'match_pairs') return 'Match Pairs';
    if (gameType === 'tower_stack') return 'Tower Stack';
    return 'Coin Catch';
  }
}
