import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  CurrentPlayer,
  type AuthenticatedPlayer,
} from '../auth/authenticated-player.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { GameSnapshot } from '../game/game.types.js';
import {
  ClaimQuestDto,
  PetActionDto,
  ProgressionActionDto,
  WorldInteractionDto,
} from './dto/progression-action.dto.js';
import { ProgressionService } from './progression.service.js';

@Controller('progression')
@UseGuards(JwtAuthGuard)
export class ProgressionController {
  constructor(private readonly progression: ProgressionService) {}

  @Post('quests/claim')
  claimQuest(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Body() body: ClaimQuestDto,
  ): Promise<GameSnapshot> {
    return this.progression.claimQuest(player.id, body);
  }

  @Post('collection/explore')
  exploreCollection(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Body() body: ProgressionActionDto,
  ): Promise<GameSnapshot> {
    return this.progression.exploreCollection(player.id, body.requestId);
  }

  @Post('world/interact')
  interact(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Body() body: WorldInteractionDto,
  ): Promise<GameSnapshot> {
    return this.progression.interact(player.id, body);
  }

  @Post('pet/action')
  petAction(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Body() body: PetActionDto,
  ): Promise<GameSnapshot> {
    return this.progression.petAction(player.id, body);
  }
}
