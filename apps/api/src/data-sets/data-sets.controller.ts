import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateQuizService } from './generate-quiz.service';
import { GenerateQuizDto } from './generate-quiz.dto';
import { DataSetDto } from './data-set.dto';

@Controller('data-sets')
export class DataSetsController {
  constructor(private readonly prisma: PrismaService, private readonly quizGenerator: GenerateQuizService) {}

  @Get()
  list() {
    return this.prisma.dataSet.findMany({ orderBy: { updatedAt: 'desc' }, include: { pairs: { orderBy: { position: 'asc' } } } });
  }

  private clean(data: DataSetDto) {
    const name = data.name.trim();
    const pairs = data.pairs.map((pair, position) => ({ question: pair.question.trim(), answer: pair.answer.trim(), position }));
    if (!name || pairs.some((pair) => !pair.question || !pair.answer)) throw new BadRequestException('A name, question, and answer are required for every pair.');
    return { name, pairs };
  }

  @Post()
  create(@Body() data: DataSetDto) {
    const { name, pairs } = this.clean(data);
    return this.prisma.dataSet.create({ data: { name, pairs: { create: pairs } }, include: { pairs: { orderBy: { position: 'asc' } } } });
  }

  @Post(':id/generate-quiz')
  generateQuiz(@Param('id', ParseIntPipe) id: number, @Body() data: GenerateQuizDto) {
    return this.quizGenerator.generate(id, data);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: DataSetDto) {
    const { name, pairs } = this.clean(data);
    if (!await this.prisma.dataSet.findUnique({ where: { id } })) throw new NotFoundException('Data set not found');
    return this.prisma.dataSet.update({ where: { id }, data: { name, pairs: { deleteMany: {}, create: pairs } }, include: { pairs: { orderBy: { position: 'asc' } } } });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    if (!await this.prisma.dataSet.findUnique({ where: { id } })) throw new NotFoundException('Data set not found');
    await this.prisma.dataSet.delete({ where: { id } });
    return { deleted: true };
  }
}
