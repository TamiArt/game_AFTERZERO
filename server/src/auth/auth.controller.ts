import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService, type LoginResult } from './auth.service.js';
import { TelegramLoginDto } from './dto/telegram-login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('telegram')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  loginWithTelegram(@Body() body: TelegramLoginDto): Promise<LoginResult> {
    return this.auth.loginWithTelegram(body.initData);
  }
}
