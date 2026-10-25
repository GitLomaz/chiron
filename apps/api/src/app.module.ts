import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ModeratedModule } from './moderated/moderated.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { HomeworkModule } from './homework/homework.module';

@Module({
  imports: [PrismaModule, QuizzesModule, ModeratedModule, HomeworkModule],
  controllers: [HealthController],
})
export class AppModule {}
