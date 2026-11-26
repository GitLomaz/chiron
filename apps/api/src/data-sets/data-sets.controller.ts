import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateQuizService } from './generate-quiz.service';
import { GenerateQuizDto, GenerateQuizFromDataSetsDto } from './generate-quiz.dto';
import { DataSetDto } from './data-set.dto';
import { GoogleAuthGuard } from '../auth/google-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';

@Controller('data-sets')
@UseGuards(GoogleAuthGuard)
export class DataSetsController {
  constructor(private readonly prisma: PrismaService, private readonly quizGenerator: GenerateQuizService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.dataSet.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: 'desc' }, include: { pairs: { orderBy: { position: 'asc' } } } });
  }

  private clean(data: DataSetDto) {
    const name = data.name.trim();
    const pairs = data.pairs.map((pair, position) => ({ question: pair.question.trim(), answer: pair.answer.trim(), position }));
    if (!name || pairs.some((pair) => !pair.question || !pair.answer)) throw new BadRequestException('A name, question, and answer are required for every pair.');
    return { name, pairs };
  }

  @Post()
  create(@Body() data: DataSetDto, @CurrentUser() user: AuthUser) {
    const { name, pairs } = this.clean(data);
    return this.prisma.dataSet.create({ data: { name, ownerId: user.id, pairs: { create: pairs } }, include: { pairs: { orderBy: { position: 'asc' } } } });
  }

  @Post('generate-quiz')
  generateQuizFromDataSets(@Body() data: GenerateQuizFromDataSetsDto, @CurrentUser() user: AuthUser) {
    return this.quizGenerator.generate(data.dataSetIds, data, user);
  }

  @Post(':id/generate-quiz')
  generateQuiz(@Param('id', ParseIntPipe) id: number, @Body() data: GenerateQuizDto, @CurrentUser() user: AuthUser) {
    return this.quizGenerator.generate([id], data, user);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: DataSetDto, @CurrentUser() user: AuthUser) {
    const { name, pairs } = this.clean(data);
    if (!await this.prisma.dataSet.findFirst({ where: { id, ownerId: user.id } })) throw new NotFoundException('Data set not found');
    return this.prisma.dataSet.update({ where: { id }, data: { name, pairs: { deleteMany: {}, create: pairs } }, include: { pairs: { orderBy: { position: 'asc' } } } });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    if (!await this.prisma.dataSet.findFirst({ where: { id, ownerId: user.id } })) throw new NotFoundException('Data set not found');
    await this.prisma.dataSet.delete({ where: { id } });
    return { deleted: true };
  }
}
