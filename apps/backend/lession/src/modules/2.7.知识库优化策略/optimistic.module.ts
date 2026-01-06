import { Module } from '@nestjs/common'

import { LangchainBasicModule } from '../2.1.对接聊天模型/langchain-basic.module'
import { EmbeddingsModule } from '../2.3.嵌入模型embeddings/embedding.module'
import { VectorStoreModule } from '../2.4.向量数据库vector-store/vector-store.module'
import { OptimisticController } from './optimistic.contorller'
import { OptimisticService } from './optimistic.service'
import { BaseRetrieverProvider } from './providers/base-retriever'
import { EnsembleRetrieverProvider } from './providers/ensemble-retriever'
import { FusionMultiQueryRetrieverProvider } from './providers/fusion-retriever'
import { HybridRetrieverProvider } from './providers/hybrid-retriever'
import { JinaRerankCompressorProvider } from './providers/jina-rerank-compressor'
import { ParentDocumentRetrieverProvider } from './providers/parent-document-retriever'
import { RerankCompressRetrieverProvider } from './providers/rerank-compress-retriever'
import { StepBackRetrieverProvider } from './providers/step-back-retriever'

@Module({
    imports: [EmbeddingsModule, LangchainBasicModule, VectorStoreModule],
    controllers: [OptimisticController],
    providers: [
        OptimisticService,
        BaseRetrieverProvider,
        HybridRetrieverProvider,
        EnsembleRetrieverProvider,
        StepBackRetrieverProvider,
        FusionMultiQueryRetrieverProvider,
        JinaRerankCompressorProvider,
        RerankCompressRetrieverProvider,
        ParentDocumentRetrieverProvider,
        { provide: 'ByteStore', useExisting: 'Cache' },
        { provide: 'Embeddings', useExisting: 'BasicEmbeddings' },
        { provide: 'VectorStore', useExisting: 'WeaviateStore' },
    ],
})
export class OptimisticModule {}
