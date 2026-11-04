import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ModeratedController } from './moderated.controller';
import { ModeratedService } from './moderated.service';

@Module({ imports: [PrismaModule], controllers: [ModeratedController], providers: [ModeratedService] })
export class ModeratedModule {}
