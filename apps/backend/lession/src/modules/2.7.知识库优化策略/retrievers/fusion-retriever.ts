/**
 * 原则上私有属性是不能继承重写的，不过编译后就没了，我们看了类的源码并安全的实现了它
 */
import { MultiQueryRetriever } from '@langchain/classic/retrievers/multi_query'
import { MultiQueryRetrieverInput } from '@langchain/classic/retrievers/multi_query'
import { CallbackManagerForRetrieverRun } from '@langchain/core/callbacks/manager'
import { Document, DocumentInterface } from '@langchain/core/documents'
import { BaseLanguageModelInterface } from '@langchain/core/language_models/base'
import { BasePromptTemplate } from '@langchain/core/prompts'
import { BaseRetrieverInterface } from '@langchain/core/retrievers'

export class FusionMultiQueryRetriever extends (MultiQueryRetriever as any) {
    private readonly rankedLists: DocumentInterface[][] = []
    private readonly _retriever: BaseRetrieverInterface

    constructor(fields: MultiQueryRetrieverInput & { k: number }) {
        super(fields)
        this.k = fields.k
        this._retriever = fields.retriever
    }

    static fromLLM(
        fields: Omit<MultiQueryRetrieverInput, 'llmChain'> & {
            llm: BaseLanguageModelInterface
            prompt?: BasePromptTemplate
        } & {
            k: number
        }
    ): MultiQueryRetriever {
        return super.fromLLM(fields)
    }

    private async _retrieveDocuments(
        queries: string[],
        runManager?: CallbackManagerForRetrieverRun
    ): Promise<Document[]> {
        await Promise.all(
            queries.map(async query => {
                const docs = await this._retriever.invoke(
                    query,
                    runManager?.getChild()
                )
                this.rankedLists.push(docs)
            })
        )
        return this.rankedLists.flat()
    }

    private _uniqueUnion(documents: Document[]): Document[] {
        const rankedLists = this.rankedLists.map(list =>
            list.map(doc => doc.pageContent)
        )
        const scoreByContent = reciprocalRankFusion(rankedLists)
        const sortedDocuments = this.sortByScore(documents, scoreByContent)
        const uniqueDocuments = this.deduplication(sortedDocuments)
        return uniqueDocuments.slice(0, this.k)
    }

    private sortByScore(
        documents: Document[],
        scoreByContent: Map<string, number>
    ): Document[] {
        return documents.sort((a, b) => {
            const scoreA = scoreByContent.get(a.pageContent) ?? 0
            const scoreB = scoreByContent.get(b.pageContent) ?? 0
            return scoreB - scoreA
        })
    }

    private deduplication(documents: Document[]): Document[] {
        return Array.from(
            documents
                .reduce((acc, doc) => {
                    if (acc.has(doc.pageContent)) {
                        return acc
                    }
                    acc.set(doc.pageContent, doc)
                    return acc
                }, new Map<string, Document>())
                .values()
        )
    }
}

/**
 * Reciprocal Rank Fusion (RRF) 算法，将多个排名列表融合为一个统一的分数排名
 * @param rankedLists - 多个排名列表，每个列表中的元素按相关性排序
 * @param k - 平滑参数，默认为 60（标准 RRF 参数）
 * @returns 每个内容对应的融合分数
 */
function reciprocalRankFusion(rankedLists: string[][], k = 60) {
    const scoreByContent = new Map<string, number>()
    rankedLists.forEach(rankedItems => {
        rankedItems.forEach((content, rank) => {
            const currentScore = scoreByContent.get(content) ?? 0
            const rrfScore = 1 / (rank + k)
            scoreByContent.set(content, currentScore + rrfScore)
        })
    })
    return scoreByContent
}
