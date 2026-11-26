import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [QuizzesController], providers: [QuizzesService] })
export class QuizzesModule {}
