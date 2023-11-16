import { Module } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { MulterModule } from '@nestjs/platform-express/multer';
import { GamesService } from './game/game.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ChatModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  ],
  controllers: [],
  providers: [PrismaService, UsersService, WebsocketGateway, GamesService]
})
export class AppModule {}
