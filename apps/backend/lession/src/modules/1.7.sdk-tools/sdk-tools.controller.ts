import { Controller, Get } from '@nestjs/common'
import { Query } from '@nestjs/common'

import { ToolCallByPromptService } from './1.提示词实现函数调用'
import { ToolCallByFunctionCallingService } from './2.function-call或工具调用'

@Controller()
export class SdkToolsController {
    constructor(
        private readonly toolCallByPromptService: ToolCallByPromptService,
        private readonly toolCallByFunctionCallingService: ToolCallByFunctionCallingService
    ) {}

    @Get('/sdk/toolCallByPrompt')
    async toolCallByPrompt(@Query('message') message: string) {
        return this.toolCallByPromptService.toolCallByPrompt(message)
    }

    @Get('/sdk/toolCallByFunctionCalling')
    async toolCallByFunctionCalling(@Query('message') message: string) {
        return this.toolCallByFunctionCallingService.toolCallByFunctionCalling(
            message
        )
    }
}
