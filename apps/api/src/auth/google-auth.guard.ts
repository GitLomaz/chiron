import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';

@Injectable()
export class GoogleAuthGuard implements CanActivate {
  constructor(private readonly auth: GoogleAuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Sign in with Google to continue');
    request.user = await this.auth.authenticate(header.slice('Bearer '.length));
    return true;
  }
}
