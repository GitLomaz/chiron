import { Module } from '@nestjs/common';
import { DataSetsController } from './data-sets.controller';
import { GenerateQuizService } from './generate-quiz.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [DataSetsController], providers: [GenerateQuizService] })
export class DataSetsModule {}
