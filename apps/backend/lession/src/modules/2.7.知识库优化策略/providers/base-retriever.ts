import { VectorStoreSupportThreshold } from '../../2.6.检索器retriever/extends/vector-store-support-threshold'

export const BaseRetrieverProvider = {
    provide: 'BaseRetriever',
    useFactory: (vectorStore: VectorStoreSupportThreshold) => {
        return vectorStore.asRetriever({
            k: 20,
            searchType: 'threshold',
            // threshold: 0.85,
        })
    },
    inject: ['VectorStore'],
}
