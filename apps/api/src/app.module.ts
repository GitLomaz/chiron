import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { PlayModule } from './play/play.module';
import { QuizzesModule } from './quizzes/quizzes.module';

@Module({
  imports: [PrismaModule, QuizzesModule, PlayModule],
  controllers: [HealthController],
})
export class AppModule {}
