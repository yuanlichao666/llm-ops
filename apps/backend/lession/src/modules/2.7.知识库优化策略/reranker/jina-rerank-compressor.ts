import { Document } from '@langchain/core/documents'
import { BaseDocumentCompressor } from '@langchain/core/retrievers/document_compressors'
import axios from 'axios'

export interface JinaRerankParams {
    apiKey: string //jina的api key
    model?: string //默认jina-reranker-v3
    topN?: number // 需要压缩成多少条，默认5条
    scoreThreshold?: number // 相关性分数阈值，过滤掉彻底不相关的块，默认0不过滤
}

export class JinaRerankCompressor extends BaseDocumentCompressor {
    private readonly apiKey: string
    private readonly model: string
    private readonly topN: number
    private readonly scoreThreshold: number
    private readonly endpoint = 'https://api.jina.ai/v1/rerank'

    constructor(params: JinaRerankParams) {
        super()
        this.apiKey = params.apiKey
        this.model = params.model ?? 'jina-reranker-v3'
        this.topN = params.topN ?? 5
        this.scoreThreshold = params.scoreThreshold ?? 0
    }

    async compressDocuments(
        documents: Document[],
        query: string
    ): Promise<Document[]> {
        // 如果没有召回文档，直接返回空数组
        if (documents.length === 0) return []

        // 1. 构建请求体：只发送 content，不返回全量文本以节省带宽
        const requestData = {
            model: this.model,
            query: query,
            documents: documents.map(doc => doc.pageContent),
            top_n: this.topN,
            return_documents: false,
        }

        // 2. 发送请求至 Jina API
        const response = await axios.post(this.endpoint, requestData, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
        })

        const { results } = response.data

        // 3. 映射逻辑解析：根据返回的 index 找回原始 Document 并注入 Score

        const compressedDocs = results
            .filter(
                (result: any) => result.relevance_score >= this.scoreThreshold
            )
            .map((result: any) => {
                const originalDoc = documents[result.index]

                // 返回新的文档对象，确保原始 Document 不被意外修改
                return {
                    ...originalDoc,
                    metadata: {
                        ...originalDoc.metadata,
                        relevance_score: result.relevance_score,
                        rerank_model: this.model,
                    },
                }
            })

        return compressedDocs
    }
}
