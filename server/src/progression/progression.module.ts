import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GameModule } from '../game/game.module.js';
import { ProgressionController } from './progression.controller.js';
import { ProgressionService } from './progression.service.js';

@Module({
  imports: [AuthModule, GameModule],
  controllers: [ProgressionController],
  providers: [ProgressionService],
})
export class ProgressionModule {}
