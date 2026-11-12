import { Module } from '@nestjs/common';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [HomeworkController], providers: [HomeworkService] })
export class HomeworkModule {}
