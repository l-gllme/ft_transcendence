import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from './src/prisma/prisma.service';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors(
    {
      origin: 'http://localhost:3000',
      credentials: true,
    },
  );
  app.use(cookieParser());
  app.get(PrismaService);

  await app.listen(4000);
  console.log(`Application is running on: http://localhost:3000`);
}

bootstrap();
