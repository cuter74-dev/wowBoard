import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CredentialsService } from './credentials.service';

@Module({
  controllers: [AiController],
  providers: [AiService, CredentialsService],
})
export class AiModule {}
