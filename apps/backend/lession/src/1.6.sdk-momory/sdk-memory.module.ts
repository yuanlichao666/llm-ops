import { Module } from '@nestjs/common'

import { OpenAISDKModule } from '../1.1.sdk_model_provider/openai-sdk.module'
import { SdkMemoryController } from './sdk-memory.controller'
import { MemoryProvider } from './sdk-memory.memory'
import { SummaryClientImpl } from './sdk-memory.memory'
import { SdkMemoryService } from './sdk-memory.service'

@Module({
  imports: [OpenAISDKModule],
  exports: [MemoryProvider],
  providers: [SdkMemoryService, MemoryProvider, SummaryClientImpl],
  controllers: [SdkMemoryController],
})
export class SdkMemoryModule {}
