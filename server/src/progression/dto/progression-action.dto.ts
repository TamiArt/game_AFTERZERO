import { IsIn, IsString, IsUUID } from 'class-validator';
import { QUEST_RULES } from '../progression.rules.js';

export class ProgressionActionDto {
  @IsUUID()
  requestId!: string;
}

export class ClaimQuestDto extends ProgressionActionDto {
  @IsString()
  @IsIn(Object.keys(QUEST_RULES))
  questId!: string;
}

export class PetActionDto extends ProgressionActionDto {
  @IsIn(['feed', 'play', 'rest'])
  action!: 'feed' | 'play' | 'rest';
}

export class WorldInteractionDto extends ProgressionActionDto {
  @IsIn(['ruins', 'portal'])
  action!: 'ruins' | 'portal';
}
