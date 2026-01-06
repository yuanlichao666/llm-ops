import { Embeddings } from '@langchain/core/embeddings'
import { Inject, Injectable } from '@nestjs/common'

const documents = [
    {
        pageContent: '你好，我是小明',
        metadata: { source: 'source1' },
    },
    {
        pageContent: '高育良被称为植物',
        metadata: { source: 'source2' },
    },
    {
        pageContent: '我喜欢猫，我养了一只猫',
        metadata: { source: 'source2' },
    },
    {
        pageContent: '这是一段关于人工智能的介绍',
        metadata: { source: 'source3' },
    },
]

const cosineDistance = (a: number[], b: number[]) => {
    const dotProduct = a.reduce((acc, curr, index) => acc + curr * b[index], 0)
    const magnitudeA = Math.sqrt(a.reduce((acc, curr) => acc + curr * curr, 0))
    const magnitudeB = Math.sqrt(b.reduce((acc, curr) => acc + curr * curr, 0))
    return dotProduct / (magnitudeA * magnitudeB)
}

@Injectable()
export class EmbeddingsService {
    constructor(
        @Inject('BasicEmbeddings') private basicEmbeddings: Embeddings,

        @Inject('CacheBackedEmbeddings')
        private cacheBackedEmbeddings: Embeddings
    ) {}

    async embeddingUsage(query: string) {
        const vectors = await this.basicEmbeddings.embedDocuments(
            documents.map(doc => doc.pageContent)
        )
        const target = await this.basicEmbeddings.embedQuery(query)

        const similars = vectors
            .map((vector, index) => {
                return {
                    distance: cosineDistance(vector, target),
                    document: documents[index],
                    index,
                }
            })
            .sort((a, b) => b.distance - a.distance)

        return similars.slice(0, 1)
    }

    // 使用缓存的嵌入查询,手动实现查询方法在内存中检索数据
    async embeddingWithCacheUsage(query: string) {
        const vectors = await this.cacheBackedEmbeddings.embedDocuments(
            documents.map(doc => doc.pageContent)
        )
        const target = await this.cacheBackedEmbeddings.embedQuery(query)

        const similars = vectors
            .map((vector, index) => {
                return {
                    distance: cosineDistance(vector, target),
                    document: documents[index],
                    index,
                }
            })
            .sort((a, b) => b.distance - a.distance)

        return similars.slice(0, 1)
    }
}
