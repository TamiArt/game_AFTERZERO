import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service.js';
import { TelegramInitDataService } from './telegram-init-data.service.js';

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
  player: {
    id: string;
    telegramId: string;
    firstName: string;
    username: string | null;
  };
  world: {
    id: string;
    name: string;
    level: number;
    xp: number;
    resources: {
      wood: number;
      stone: number;
      metal: number;
      energy: number;
    };
  };
}

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramInitData: TelegramInitDataService,
    private readonly jwt: JwtService,
  ) {}

  async loginWithTelegram(initData: string): Promise<LoginResult> {
    const telegramUser = this.telegramInitData.verify(initData);

    const { player, world } = await this.prisma.$transaction(async (transaction) => {
      const player = await transaction.player.upsert({
        where: { telegramId: BigInt(telegramUser.id) },
        update: {
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
          languageCode: telegramUser.language_code,
        },
        create: {
          telegramId: BigInt(telegramUser.id),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
          languageCode: telegramUser.language_code,
        },
      });

      const world = await transaction.world.upsert({
        where: { ownerId: player.id },
        update: {},
        create: {
          ownerId: player.id,
          name: `Остров ${telegramUser.first_name}`,
          resources: { create: {} },
          pet: { create: {} },
        },
        include: { resources: true },
      });

      return { player, world };
    });

    if (!world.resources) {
      throw new Error('World resource balance was not created');
    }

    const accessToken = await this.jwt.signAsync({
      sub: player.id,
      telegramId: player.telegramId.toString(),
    });

    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      player: {
        id: player.id,
        telegramId: player.telegramId.toString(),
        firstName: player.firstName,
        username: player.username,
      },
      world: {
        id: world.id,
        name: world.name,
        level: world.level,
        xp: world.xp,
        resources: {
          wood: world.resources.wood,
          stone: world.resources.stone,
          metal: world.resources.metal,
          energy: world.resources.energy,
        },
      },
    };
  }
}
