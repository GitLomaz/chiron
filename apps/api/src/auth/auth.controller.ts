import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { GoogleAuthGuard } from './google-auth.guard';
import { AuthUser } from './auth.types';

@Controller('auth')
@UseGuards(GoogleAuthGuard)
export class AuthController {
  @Get('me') me(@CurrentUser() user: AuthUser) { return user; }
}
