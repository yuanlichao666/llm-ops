import { Module } from '@nestjs/common'

import { LangchainBasicModule } from '../2.1.对接聊天模型/langchain-basic.module'
import { LangchainToolsController } from './langchain-tools.controller'
import { LangchainToolsService } from './langchain-tools.service'
import { EnhancedSerpApiProvider } from './providers/enhanced-serp-api'
// import { SerpApiProvider } from './providers/serp-api'
@Module({
    imports: [LangchainBasicModule],
    controllers: [LangchainToolsController],
    providers: [
        EnhancedSerpApiProvider,
        LangchainToolsService,
        // SerpApiProvider,
    ],
    exports: [EnhancedSerpApiProvider],
})
export class LangchainToolsModule {}
