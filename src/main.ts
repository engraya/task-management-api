import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger.config.js';

import { AppModule } from './app.module.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN'), credentials: true });

  // Concept — Concepts §8: global ValidationPipe. `whitelist` strips unknown
  // properties from every incoming body; `forbidNonWhitelisted` rejects the
  // request outright if it tried to send one; `transform` turns plain JSON
  // into real DTO class instances so `@Type()` conversions (Part 18.1) run.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  app.setGlobalPrefix('api/v1');

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks(); // graceful shutdown: closes DB connections on SIGTERM

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap().catch((error: unknown) => {
  console.error('Failed to start the application:', error);
  process.exitCode = 1;
});
