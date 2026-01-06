import { Embeddings } from '@langchain/core/embeddings'
import { WeaviateStore } from '@langchain/weaviate'
import { WeaviateClient } from 'weaviate-client'

export const WEAVIATE_STORE = Symbol('WEAVIATE_STORE')

export const WeaviateStoreProvider = {
    provide: WEAVIATE_STORE,
    useFactory: (embeddings: Embeddings, vectorClient: WeaviateClient) => {
        return new WeaviateStore(embeddings, {
            client: vectorClient,
        })
    },
    inject: ['Embeddings'],
}
