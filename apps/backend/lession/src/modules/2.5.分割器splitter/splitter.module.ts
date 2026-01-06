import { Module } from '@nestjs/common'

import { EmbeddingsModule } from '../2.3.嵌入模型embeddings/embedding.module'
import { VectorStoreModule } from '../2.4.向量数据库vector-store/vector-store.module'
import { SplitterController } from './spliter.controller'
import { SplitterService } from './spliter.service'

@Module({
    imports: [EmbeddingsModule, VectorStoreModule],
    controllers: [SplitterController],
    providers: [
        SplitterService,
        { provide: 'Embeddings', useExisting: 'CacheBackedEmbeddings' },
        { provide: 'VectorStore', useExisting: 'WeaviateStore' },
    ],
})
export class SplitterModule {}
