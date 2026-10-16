import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GameController } from './game.controller.js';
import { GameService } from './game.service.js';

@Module({
  imports: [AuthModule],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
