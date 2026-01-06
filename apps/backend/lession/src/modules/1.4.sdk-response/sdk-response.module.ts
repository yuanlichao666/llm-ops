import { Module } from '@nestjs/common'

import { OpenAISDKModule } from '../1.1.sdk-model-provider/openai-sdk.module'
import { ResponseController } from './sdk-response.controller'
import { ResponseService } from './sdk-response.service'

@Module({
    imports: [OpenAISDKModule],
    providers: [ResponseService],
    controllers: [ResponseController],
})
export class ResponseModule {}
