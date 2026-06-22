import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { ScreensModule } from './screens/screens.module';
import { ShareModule } from './share/share.module';
import { AiModule } from './ai/ai.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    // Pin the env file to apps/api/.env regardless of the process cwd, so it
    // doesn't accidentally read a stray .env in the workspace root.
    // (dist layout: apps/api/dist/app.module.js → ../.env = apps/api/.env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    ScreensModule,
    ShareModule,
    AiModule,
    TemplatesModule,
  ],
})
export class AppModule {}
