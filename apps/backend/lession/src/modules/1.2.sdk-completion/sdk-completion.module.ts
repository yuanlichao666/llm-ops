import { Module } from '@nestjs/common'

import { OpenAISDKModule } from '../1.1.sdk-model-provider/openai-sdk.module'
import { CompletionController } from './sdk-completion.controller'
import { CompletionService } from './sdk-completion.service'

@Module({
    imports: [OpenAISDKModule],
    controllers: [CompletionController],
    providers: [CompletionService],
})
export class CompletionModule {}
