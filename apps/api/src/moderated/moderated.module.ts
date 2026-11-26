import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ModeratedController } from './moderated.controller';
import { ModeratedService } from './moderated.service';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [PrismaModule, AuthModule], controllers: [ModeratedController], providers: [ModeratedService] })
export class ModeratedModule {}
