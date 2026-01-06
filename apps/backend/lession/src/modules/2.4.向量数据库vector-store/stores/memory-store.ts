import { DocumentInterface } from '@langchain/core/documents'
import { Embeddings } from '@langchain/core/embeddings'
import { VectorStore } from '@langchain/core/vectorstores'
import crypto from 'crypto'

import { WithHashID } from '../extends/add-document-with-hash-id'

type Options = {
    ids?: string[]
}

// 实现一个内存向量存储,通过继承VectorStore并实现主要方法
export class CustomVectorStore extends VectorStore {
    private recordByDocId: Record<
        string,
        { vector: number[]; doc: DocumentInterface; id: string }
    > = {}

    _vectorstoreType(): string {
        return 'MemoryVectorStore'
    }

    private createId(content: string) {
        return crypto.createHash('md5').update(content).digest('hex')
    }

    private createNewRecords(
        vectors: number[][],
        documents: DocumentInterface[],
        options?: Options
    ) {
        const ids = options?.ids ?? []
        return vectors.reduce((acc, vector, index) => {
            const doc = documents[index]
            const content = doc.pageContent

            const id = ids[index] ?? doc.id ?? this.createId(content)
            const record = { id, vector, doc }

            acc[id] = record
            return acc
        }, {})
    }

    addVectors(
        vectors: number[][],
        documents: DocumentInterface[],
        options?: Options
    ): Promise<string[] | void> {
        this.validateInputs(vectors, documents)
        const newData = this.createNewRecords(vectors, documents, options)
        const fullData = Object.assign(this.recordByDocId, newData)
        this.recordByDocId = fullData
        return Promise.resolve(Object.keys(newData))
    }

    private validateInputs(
        vectors: number[][],
        documents: DocumentInterface[]
    ) {
        // 变量和文档必须同时存在
        if (!vectors.length || !documents.length) {
            throw new Error('Vectors and documents are required')
        }
        // 变量和文档必须一一对应
        if (vectors.length !== documents.length) {
            throw new Error('Vectors and documents must be the same length')
        }
        // 不能重读添加
        if (documents.some(doc => this.recordByDocId[doc.id ?? 'node_id'])) {
            throw new Error(`Document already exists`)
        }
    }

    async addDocuments(
        documents: DocumentInterface[],
        options?: Options
    ): Promise<string[] | void> {
        // 如果传了ids，
        if (options?.ids) {
            // ids应该documents一一对应
            if (options?.ids && !sameLength(options.ids, documents)) {
                throw new Error('ids and documents must be the same length')
            }
            // 不能重读添加
            if (options.ids.some(id => this.recordByDocId[id])) {
                throw new Error(`Document already exists`)
            }
        }
        const vectors = await this.embeddings.embedDocuments(
            documents.map(doc => doc.pageContent)
        )
        return await this.addVectors(vectors, documents, options)
    }

    async similaritySearch(
        query: string,
        k?: number
    ): Promise<DocumentInterface[]> {
        const target = await this.embeddings.embedQuery(query)
        const results = await this.similaritySearchVectorWithScore(target, k)
        return results.map(item => item[0])
    }

    async similaritySearchVectorWithScore(
        query: number[],
        k?: number
    ): Promise<[DocumentInterface, number][]> {
        k = k ?? Math.min(10, Object.values(this.recordByDocId).length)

        const scores = Object.values(this.recordByDocId)
            .map(({ vector, id }) => ({
                id,
                score: cosineDistance(vector, query),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, k)

        const results = scores.map(({ id, score }) => {
            const record = this.recordByDocId[id]
            return [record.doc, score]
        })

        return Promise.resolve(results as [DocumentInterface, number][])
    }
}

function cosineDistance(a: number[], b: number[]) {
    const dotProduct = a.reduce((acc, curr, index) => acc + curr * b[index], 0)
    const magnitudeA = Math.sqrt(a.reduce((acc, curr) => acc + curr * curr, 0))
    const magnitudeB = Math.sqrt(b.reduce((acc, curr) => acc + curr * curr, 0))
    return dotProduct / (magnitudeA * magnitudeB)
}

const CustomVectorStoreWithHashID = WithHashID()(CustomVectorStore)

export const CustomVectorStoreProvider = {
    provide: 'CustomVectorStore',
    useFactory: (embeddings: Embeddings) =>
        new CustomVectorStoreWithHashID(embeddings, {}),
    inject: ['Embeddings'],
}

function sameLength(a: any[], b: any[]) {
    return a.length === b.length
}
