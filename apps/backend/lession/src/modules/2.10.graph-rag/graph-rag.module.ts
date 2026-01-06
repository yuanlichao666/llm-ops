import { Module } from '@nestjs/common'

import { WEAVIATE_STORE } from '../../fundamental/database/weaviate/weaviate.store'
import { DOUBAO_SEED_MODEL } from '../../fundamental/llm/doubao'
import { HUGGINGFACE_EMBEDDING_MODEL_GOOGLE } from '../../fundamental/llm/huggingface'
import { GraphRagController } from './graph-rag.controller'
import { GraphRagService } from './graph-rag.service'

@Module({
    imports: [],
    controllers: [GraphRagController],
    providers: [
        GraphRagService,
        {
            provide: 'Embeddings',
            useExisting: HUGGINGFACE_EMBEDDING_MODEL_GOOGLE,
        },
        { provide: 'ChatModel', useExisting: DOUBAO_SEED_MODEL },
        { provide: 'VectorStore', useExisting: WEAVIATE_STORE },
    ],
    exports: [],
})
export class GraphRagModule {
    constructor() {}
}
