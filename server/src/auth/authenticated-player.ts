import {
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedPlayer {
  id: string;
  telegramId: string;
}

interface AuthenticatedRequest extends Request {
  player: AuthenticatedPlayer;
}

export const CurrentPlayer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPlayer => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().player;
  },
);
