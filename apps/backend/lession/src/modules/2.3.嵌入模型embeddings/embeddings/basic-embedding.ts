import { ByteDanceDoubaoEmbeddings } from '@langchain/community/embeddings/bytedance_doubao'

export function BasicEmbeddingsFactory() {
    return new ByteDanceDoubaoEmbeddings({
        apiKey: '2f98ac95-a737-4672-bbae-ea5b3bb3a398',
        model: 'doubao-embedding-vision-251215', // your entrypoint's name
    })
}

export const BasicEmbeddingsProvider = {
    provide: 'BasicEmbeddings',
    useFactory: BasicEmbeddingsFactory,
}
