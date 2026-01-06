import { Embeddings } from '@langchain/core/embeddings'
import { WeaviateStore } from '@langchain/weaviate'
import weaviate from 'weaviate-client'

import { SupportThreshold } from '../extends/vector-store-support-threshold'

const WeaviateStoreSupportThreshold = SupportThreshold(WeaviateStore)

export const WeaviateStoreSupportThresholdProvider = {
    provide: 'WeaviateStoreSupportThreshold',
    useFactory: async (embeddings: Embeddings) => {
        const weaviateClient = await weaviate.connectToLocal({
            host: process.env.WEAVIATE_URL!,
            port: 8080,
            authCredentials: new weaviate.ApiKey('user-a-key'),
        })
        const weaviateVectorStore = new WeaviateStoreSupportThreshold(
            embeddings,
            {
                client: weaviateClient,
                // Must start with a capital letter
                indexName: 'Langchainjs_test',
            }
        )
        return weaviateVectorStore
    },
    inject: ['Embeddings'],
}
