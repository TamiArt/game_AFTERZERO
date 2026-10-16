import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentPlayer,
  type AuthenticatedPlayer,
} from '../auth/authenticated-player.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  CollectResourceDto,
  IdempotentActionDto,
  StartBuildingDto,
} from './dto/game-action.dto.js';
import { GameService } from './game.service.js';
import type { GameSnapshot } from './game.types.js';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly game: GameService) {}

  @Get('state')
  state(@CurrentPlayer() player: AuthenticatedPlayer): Promise<GameSnapshot> {
    return this.game.getState(player.id);
  }

  @Post('collect')
  collect(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Body() body: CollectResourceDto,
  ): Promise<GameSnapshot> {
    return this.game.collect(player.id, body);
  }

  @Post('buildings')
  startBuilding(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Body() body: StartBuildingDto,
  ): Promise<GameSnapshot> {
    return this.game.startBuilding(player.id, body);
  }

  @Post('buildings/:buildingId/complete')
  completeBuilding(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() body: IdempotentActionDto,
  ): Promise<GameSnapshot> {
    return this.game.completeBuilding(player.id, buildingId, body.requestId);
  }

  @Post('daily')
  claimDaily(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Body() body: IdempotentActionDto,
  ): Promise<GameSnapshot> {
    return this.game.claimDaily(player.id, body.requestId);
  }

  @Post('production')
  claimProduction(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Body() body: IdempotentActionDto,
  ): Promise<GameSnapshot> {
    return this.game.claimProduction(player.id, body.requestId);
  }
}
