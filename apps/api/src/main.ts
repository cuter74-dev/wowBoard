import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  // Larger limit for base64 image uploads (screenshot → template).
  const { json, urlencoded } = await import('express');
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ limit: '12mb', extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  // WEB_ORIGIN may be a comma-separated allowlist. Any listed origin is
  // accepted (credentials need an exact origin echo, not "*").
  const allowed = config
    .get<string>('WEB_ORIGIN', 'http://localhost:7100')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) cb(null, true);
      else cb(new Error(`Origin not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
  });

  const port = config.get<number>('API_PORT', 7000);
  // Listen on all interfaces so remote hosts can reach the API.
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[wowBoard API] listening on http://0.0.0.0:${port}`);
}
bootstrap();
