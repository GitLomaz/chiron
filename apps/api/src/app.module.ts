import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { QuizzesModule } from './quizzes/quizzes.module';

@Module({
  imports: [PrismaModule, QuizzesModule],
  controllers: [HealthController],
})
export class AppModule {}
