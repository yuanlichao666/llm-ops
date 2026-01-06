import { Document } from '@langchain/core/documents'
import { VectorStore } from '@langchain/core/vectorstores'
import { WeaviateStore } from '@langchain/weaviate'
import { Injectable } from '@nestjs/common'
import { Inject } from '@nestjs/common'

@Injectable()
export class VectorStoreService {
    constructor(
        @Inject('FaissStore') private faissStore: VectorStore,

        @Inject('WeaviateStore') private weaviateVectorStore: WeaviateStore,

        @Inject('CustomVectorStore') private customVectorStore: VectorStore
    ) {}

    // 将嵌入的数据存储在向量数据库中供后续查询
    async addDocumentsUseFaissStore(docs: string[]) {
        const documentsToAdd = docs.map(
            doc => new Document({ pageContent: doc, metadata: {} })
        )
        return await this.faissStore.addDocuments(documentsToAdd)
    }

    async queryUseFaissStore(query: string) {
        const results = await this.faissStore.similaritySearch(query, 1)
        return results
    }

    async addDocumentsUseWeaviateStore(docs: string[]) {
        const documentsToAdd = docs.map(
            doc => new Document({ pageContent: doc, metadata: {} })
        )
        return await this.weaviateVectorStore.addDocuments(documentsToAdd)
    }

    async queryUseWeaviateStore(query: string, k?: number) {
        const results =
            await this.weaviateVectorStore.similaritySearchWithScore(
                query,
                k ?? 1
            )
        return results
    }

    async addDocumentsUseCustomStore(docs: string[]) {
        const documentsToAdd = docs.map(
            doc => new Document({ pageContent: doc, metadata: {} })
        )
        return await this.customVectorStore.addDocuments(documentsToAdd)
    }

    async queryUseCustomStore(query: string) {
        const results = await this.customVectorStore.similaritySearch(query, 1)
        return results
    }

    async queryWithThreshold(query: string) {
        const results = await this.weaviateVectorStore.hybridSearch(query, {
            alpha: 1, // 设为 1 表示纯向量搜索，此时 maxVectorDistance 才能完全生效
            maxVectorDistance: 0.5, // 距离阈值（余弦距离范围 0-2，越小越相似）
        })
        return results
    }

    async maxMarginalRelevanceSearch(query: string) {
        const results =
            await this.weaviateVectorStore.maxMarginalRelevanceSearch(query, {
                k: 3,
            })
        return results
    }
}
