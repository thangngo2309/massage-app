import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT', 7200);
  const prefix = configService.get<string>('APP_PREFIX', 'api');
  const adminUrl = configService.get<string>('ADMIN_URL');
  const webUrl = configService.get<string>('WEB_URL');

  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: [adminUrl, webUrl].filter(Boolean),
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
  console.log(`Massage API running at http://localhost:${port}/${prefix}`);
}

bootstrap();
