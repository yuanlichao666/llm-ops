import { Embeddings } from '@langchain/core/embeddings'
import { WeaviateStore } from '@langchain/weaviate'
import weaviate from 'weaviate-client'

import { WithHashID } from '../extends/add-document-with-hash-id'

const WeaviateStoreWithHashID = WithHashID()(WeaviateStore)

// export class ExtendsWeaviateStore extends WeaviateStore {
//   async similaritySearchWithScore(query: string, k?: number) {
// }

export async function WeaviateStoreFactory(embeddings: Embeddings) {
    const weaviateClient = await weaviate.connectToLocal({
        host: process.env.WEAVIATE_URL!,
        port: 8080,
        authCredentials: new weaviate.ApiKey('user-a-key'),
    })
    const weaviateVectorStore = new WeaviateStoreWithHashID(embeddings, {
        client: weaviateClient,
        indexName: 'Langchainjs_test',
    })
    return weaviateVectorStore
}

export const WeaviateStoreProvider = {
    provide: 'WeaviateStore',
    useFactory: WeaviateStoreFactory,
    inject: ['Embeddings'],
}
