import {
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BUILDING_RULES, RESOURCE_NODE_RULES } from '../game.rules.js';

export class IdempotentActionDto {
  @IsUUID()
  requestId!: string;
}

export class CollectResourceDto extends IdempotentActionDto {
  @IsString()
  @MaxLength(16)
  @IsIn(Object.keys(RESOURCE_NODE_RULES))
  nodeId!: string;
}

export class StartBuildingDto extends IdempotentActionDto {
  @IsString()
  @IsIn(Object.keys(BUILDING_RULES))
  type!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  tileC!: number;

  @IsInt()
  @Min(0)
  @Max(6)
  tileR!: number;
}
