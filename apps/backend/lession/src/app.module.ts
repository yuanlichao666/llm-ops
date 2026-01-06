import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from './fundamental/database/database.module'
import { LLMModule } from './fundamental/llm/llm.module'
import { SetupModule } from './fundamental/setup/setup.module'
import { CompletionModule } from './modules/1.2.sdk-completion/sdk-completion.module'
import { ChatCompletionModule } from './modules/1.3.sdk-chat_completion/chat-completion.module'
import { ResponseModule } from './modules/1.4.sdk-response/sdk-response.module'
import { StreamModule } from './modules/1.5.sdk-stream/stream.module'
import { SdkMemoryModule } from './modules/1.6.sdk-momory/sdk-memory.module'
import { SdkToolsModule } from './modules/1.7.sdk-tools/sdk-tools.module'
import { LangchainBasicModule } from './modules/2.1.对接聊天模型/langchain-basic.module'
import { LangchainMemoryModule } from './modules/2.2.手写摘要缓冲记忆类/memory.module'
import { EmbeddingsModule } from './modules/2.3.嵌入模型embeddings/embedding.module'
import { SplitterModule } from './modules/2.5.分割器splitter/splitter.module'
import { RetrieverModule } from './modules/2.6.检索器retriever/retriever.module'
import { OptimisticModule } from './modules/2.7.知识库优化策略/optimistic.module'
import { LangchainToolsModule } from './modules/2.8.langchain内置工具/langchain-tools.module'
import { LangchainAgentModule } from './modules/2.9.langchain-agent/langchain-agent.module'
@Module({
    imports: [
        // fundamental
        ConfigModule,
        SetupModule,
        LLMModule,
        DatabaseModule,

        // lessions
        CompletionModule,
        ChatCompletionModule,
        ResponseModule,
        StreamModule,
        SdkMemoryModule,
        SdkToolsModule,
        LangchainBasicModule,
        LangchainMemoryModule,
        EmbeddingsModule,
        RetrieverModule,
        SplitterModule,
        OptimisticModule,
        LangchainToolsModule,
        LangchainAgentModule,
    ],
})
export class AppModule {}
