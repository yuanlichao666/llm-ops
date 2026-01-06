import { Module } from '@nestjs/common'

import { OpenAISDKModule } from '../1.1.sdk-model-provider/openai-sdk.module'
import { ToolCallByPromptService } from './1.提示词实现函数调用'
import { ToolCallByFunctionCallingService } from './2.function-call或工具调用'
import { SdkToolsController } from './sdk-tools.controller'

@Module({
    imports: [OpenAISDKModule],
    controllers: [SdkToolsController],
    providers: [ToolCallByPromptService, ToolCallByFunctionCallingService],
    exports: [],
})
export class SdkToolsModule {}
