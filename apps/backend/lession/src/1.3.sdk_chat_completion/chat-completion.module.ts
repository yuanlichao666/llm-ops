import { Module } from '@nestjs/common'

import { OpenAISDKModule } from '../1.1.sdk_model_provider/openai-sdk.module'
import { ChatCompletionController } from './sdk-chat-completion.controller'
import { ChatCompletionService } from './sdk-chat-completion.service'

@Module({
  imports: [OpenAISDKModule],
  providers: [ChatCompletionService],
  controllers: [ChatCompletionController],
})
export class ChatCompletionModule {}
