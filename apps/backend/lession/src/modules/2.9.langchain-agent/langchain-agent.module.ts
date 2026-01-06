import { Module } from '@nestjs/common'

import { LangchainBasicModule } from '../2.1.对接聊天模型/langchain-basic.module'
import { EmbeddingsModule } from '../2.3.嵌入模型embeddings/embedding.module'
import { VectorStoreModule } from '../2.4.向量数据库vector-store/vector-store.module'
import { LangchainToolsModule } from '../2.8.langchain内置工具/langchain-tools.module'
import { LangchainAgentController } from './langchain-agent.controller'
import { LangchainAgentService } from './langchain-agent.service'

@Module({
    imports: [
        LangchainBasicModule,
        LangchainToolsModule,
        VectorStoreModule,
        EmbeddingsModule,
    ],
    controllers: [LangchainAgentController],
    providers: [
        LangchainAgentService,
        {
            provide: 'ByteStore',
            useExisting: 'Cache',
        },
        {
            provide: 'VectorStore',
            useExisting: 'WeaviateStore',
        },
    ],
    exports: [],
})
export class LangchainAgentModule {}
