import { Module } from '@nestjs/common'

import { LangchainBasicModule } from '../2.1.对接聊天模型/langchain-basic.module'
import {
    MemoryProviderUseCustomRunnableWithMessageHistory,
    MemoryProviderUseRunnableWithMessageHistory,
} from './memory.provider'
import { LangchainMemoryService } from './memory.service'
import { LangchainMemoryController } from './momory.controller'

@Module({
    imports: [LangchainBasicModule],
    controllers: [LangchainMemoryController],
    providers: [
        LangchainMemoryService,
        MemoryProviderUseRunnableWithMessageHistory,
        MemoryProviderUseCustomRunnableWithMessageHistory,
    ],
    exports: [
        MemoryProviderUseRunnableWithMessageHistory,
        MemoryProviderUseCustomRunnableWithMessageHistory,
    ],
})
export class LangchainMemoryModule {}
