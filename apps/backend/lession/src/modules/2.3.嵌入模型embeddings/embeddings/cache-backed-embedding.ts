import { CacheBackedEmbeddings } from '@langchain/classic/embeddings/cache_backed'
import { Embeddings } from '@langchain/core/embeddings'
import { BaseStore } from '@langchain/core/stores'

export function CacheBackedEmbeddingsFactory(
    embeddings: Embeddings,
    cache: BaseStore<string, Uint8Array>
) {
    return CacheBackedEmbeddings.fromBytesStore(embeddings, cache)
}

export const CacheBackedEmbeddingsProvider = {
    provide: 'CacheBackedEmbeddings',
    useFactory: CacheBackedEmbeddingsFactory,
    inject: ['BasicEmbeddings', 'Cache'],
}
