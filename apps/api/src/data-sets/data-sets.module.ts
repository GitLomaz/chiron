import { Module } from '@nestjs/common';
import { DataSetsController } from './data-sets.controller';
import { GenerateQuizService } from './generate-quiz.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule, AuthModule], controllers: [DataSetsController], providers: [GenerateQuizService] })
export class DataSetsModule {}
