import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TelegramLoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000)
  initData!: string;
}
