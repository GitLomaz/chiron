import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './auth.types';

@Injectable()
export class GoogleAuthService {
  private readonly client = new OAuth2Client();
  constructor(private readonly prisma: PrismaService) {}

  async authenticate(idToken: string): Promise<AuthUser> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new ServiceUnavailableException('Google sign-in has not been configured');
    let payload;
    try {
      payload = (await this.client.verifyIdToken({ idToken, audience: clientId })).getPayload();
    } catch {
      throw new UnauthorizedException('Google sign-in could not be verified');
    }
    if (!payload?.sub || !payload.email || !payload.email_verified) throw new UnauthorizedException('A verified Google email address is required');
    const user = await this.prisma.user.upsert({
      where: { googleSubject: payload.sub },
      create: { googleSubject: payload.sub, email: payload.email, name: payload.name || payload.email, picture: payload.picture || null },
      update: { email: payload.email, name: payload.name || payload.email, picture: payload.picture || null },
    });
    return { id: user.id, email: user.email, name: user.name, picture: user.picture, canViewAllQuizzes: user.canViewAllQuizzes };
  }
}
