import { Module } from '@nestjs/common'

import { LangchainBasicModule } from '../2.1.对接聊天模型/langchain-basic.module'
import { LangchainMemoryModule } from '../2.2.手写摘要缓冲记忆类/memory.module'
import { EmbeddingsModule } from '../2.3.嵌入模型embeddings/embedding.module'
import { FaissStoreProvider } from './stores/faiss-vector'
import { CustomVectorStoreProvider } from './stores/memory-store'
import { WeaviateStoreProvider } from './stores/weaviate-store'
import { VectorStoreController } from './vector-store.controller'
import { VectorStoreService } from './vector-store.service'

@Module({
    imports: [LangchainBasicModule, LangchainMemoryModule, EmbeddingsModule],
    controllers: [VectorStoreController],
    providers: [
        {
            provide: 'Embeddings',
            useExisting: 'HuggingFaceEmbeddings',
        },
        FaissStoreProvider,
        WeaviateStoreProvider,
        CustomVectorStoreProvider,
        VectorStoreService,
    ],
    exports: [
        FaissStoreProvider,
        WeaviateStoreProvider,
        CustomVectorStoreProvider,
    ],
})
export class VectorStoreModule {}
