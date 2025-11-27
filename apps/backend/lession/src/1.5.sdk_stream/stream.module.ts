import { Module } from '@nestjs/common'

import { OpenAISDKModule } from '../1.1.sdk_model_provider/openai-sdk.module'
import { StreamController } from './stream.controller'
import { StreamService } from './stream.service'

@Module({
  imports: [OpenAISDKModule],
  providers: [StreamService],
  controllers: [StreamController],
})
export class StreamModule {}
