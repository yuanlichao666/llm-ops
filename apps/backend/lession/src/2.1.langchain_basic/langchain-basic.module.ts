import { Module } from '@nestjs/common'

import { LangchainBasicController } from './langchain-basic.controller'
import { LangchainBasicService } from './langchain-basic.service'
import { ChatModelProvider } from './langchain-chat-model.provider'

@Module({
  controllers: [LangchainBasicController],
  providers: [LangchainBasicService, ChatModelProvider],
})
export class LangchainBasicModule {}
