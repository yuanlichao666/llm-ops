import { Module } from '@nestjs/common'

import { ChatModelProvider } from '../2.1.langchain_basic/langchain-chat-model.provider'
import { CustomMemory, Memory } from './langchain-memory.provider'
import { LangchainMemoryService } from './langchain-memory.service'
import { LangchainMemoryController } from './langchain-momory-controller'

@Module({
  controllers: [LangchainMemoryController],
  providers: [Memory, CustomMemory, ChatModelProvider, LangchainMemoryService],
  exports: [Memory, CustomMemory, ChatModelProvider],
})
export class LangchainMemoryModule {}
