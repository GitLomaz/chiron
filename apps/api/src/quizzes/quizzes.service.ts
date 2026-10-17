import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';

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
      include: { questions: { orderBy: { createdAt: 'asc' } } },
    });

    if (!quiz) throw new NotFoundException(`Quiz ${id} was not found`);
    return quiz;
  }

  create({ title, description }: CreateQuizDto) {
    if (!title.trim()) {
      throw new BadRequestException('title cannot be blank');
    }

    return this.prisma.quiz.create({
      data: { title: title.trim(), description: description?.trim() || null },
    });
  }

  async addQuestion(quizId: number, question: CreateQuestionDto) {
    await this.findOne(quizId);
    const options = question.options.map((option) => option.trim());
    const correctAnswer = question.correctAnswer.trim();

    if (!question.text.trim() || options.some((option) => !option) || !correctAnswer) {
      throw new BadRequestException('Question text and answer options cannot be blank');
    }

    if (!options.includes(correctAnswer)) {
      throw new BadRequestException('correctAnswer must match one of the provided options');
    }

    return this.prisma.question.create({
      data: {
        quizId,
        text: question.text.trim(),
        options: options as Prisma.InputJsonValue,
        correctAnswer,
      },
    });
  }
}
