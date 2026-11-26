import { Module } from '@nestjs/common';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';
import { AuthModule } from '../auth/auth.module';
import { SpeechRecognitionService } from './speech-recognition.service';

@Module({ imports: [AuthModule], controllers: [HomeworkController], providers: [HomeworkService, SpeechRecognitionService] })
export class HomeworkModule {}
