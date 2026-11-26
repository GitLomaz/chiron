import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleAuthService } from './google-auth.service';

@Module({ imports: [PrismaModule], controllers: [AuthController], providers: [GoogleAuthService, GoogleAuthGuard], exports: [GoogleAuthService, GoogleAuthGuard] })
export class AuthModule {}
