import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GamesService } from '../game/game.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, GamesService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
