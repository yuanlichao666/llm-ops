import { Module } from '@nestjs/common'

import { LangchainBasicModule } from '../2.1.对接聊天模型/langchain-basic.module'
import { LangchainMemoryModule } from '../2.2.手写摘要缓冲记忆类/memory.module'
import { EmbeddingsController } from './embedding.controller'
import { EmbeddingsService } from './embedding.service'
import { BasicEmbeddingsProvider } from './embeddings/basic-embedding'
import { CacheBackedEmbeddingsProvider } from './embeddings/cache-backed-embedding'
import { HuggingFaceEmbeddingsProvider } from './embeddings/huggingface-embedding'
import { CacheProvider } from './extends/local-file-cache'

@Module({
    imports: [LangchainMemoryModule, LangchainBasicModule],
    controllers: [EmbeddingsController],
    providers: [
        CacheProvider,
        BasicEmbeddingsProvider,
        CacheBackedEmbeddingsProvider,
        HuggingFaceEmbeddingsProvider,
        EmbeddingsService,
    ],
    exports: [
        CacheProvider,
        BasicEmbeddingsProvider,
        HuggingFaceEmbeddingsProvider,
        CacheBackedEmbeddingsProvider,
    ],
})
export class EmbeddingsModule {}
