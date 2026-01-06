import { Module } from '@nestjs/common'

import { LangchainBasicController } from './langchain-basic.controller'
import { LangchainBasicService } from './langchain-basic.service'

@Module({
    controllers: [LangchainBasicController],
    providers: [LangchainBasicService],
    exports: [],
})
export class LangchainBasicModule {}
