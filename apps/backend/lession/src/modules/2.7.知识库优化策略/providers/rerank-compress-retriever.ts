import { ContextualCompressionRetriever } from '@langchain/classic/retrievers/contextual_compression'
import { BaseRetriever } from '@langchain/core/retrievers'
import { BaseDocumentCompressor } from '@langchain/core/retrievers/document_compressors'

export const RerankCompressRetrieverProvider = {
    provide: 'RerankCompressRetriever',
    useFactory: (
        retriever: BaseRetriever,
        compressor: BaseDocumentCompressor
    ) => {
        return new ContextualCompressionRetriever({
            baseRetriever: retriever,
            baseCompressor: compressor,
        })
    },
    inject: ['BaseRetriever', 'JinaRerankCompressor'],
}
