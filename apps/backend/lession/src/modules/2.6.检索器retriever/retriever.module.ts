import { Module } from '@nestjs/common'

import { LangchainBasicModule } from '../2.1.对接聊天模型/langchain-basic.module'
import { LangchainMemoryModule } from '../2.2.手写摘要缓冲记忆类/memory.module'
import { EmbeddingsModule } from '../2.3.嵌入模型embeddings/embedding.module'
import { VectorStoreModule } from '../2.4.向量数据库vector-store/vector-store.module'
import { RetrieverController } from './retriever.controller'
import { RetrieverService } from './retriever.service'
import { WeaviateStoreSupportThresholdProvider } from './stores/WeaviateStoreSupportThreshold'

@Module({
    imports: [
        LangchainBasicModule,
        LangchainMemoryModule,
        VectorStoreModule,
        EmbeddingsModule,
    ],
    controllers: [RetrieverController],
    providers: [
        RetrieverService,
        WeaviateStoreSupportThresholdProvider,
        {
            provide: 'Embeddings',
            useExisting: 'HuggingFaceEmbeddings',
        },
        {
            provide: 'Memory',
            useExisting: 'MemoryByRunnableWithMessageHistory',
        },
        {
            provide: 'VectorStore',
            useExisting: 'WeaviateStoreSupportThreshold',
        },
    ],
    exports: [WeaviateStoreSupportThresholdProvider],
})
export class RetrieverModule {}
