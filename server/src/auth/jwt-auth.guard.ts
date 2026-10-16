import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticatedPlayer } from './authenticated-player.js';

interface JwtPayload {
  sub: string;
  telegramId: string;
}

interface AuthenticatedRequest extends Request {
  player?: AuthenticatedPlayer;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication is required');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        issuer: 'afterzero-api',
      });
      request.player = {
        id: payload.sub,
        telegramId: payload.telegramId,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Session has expired');
    }
  }
}
