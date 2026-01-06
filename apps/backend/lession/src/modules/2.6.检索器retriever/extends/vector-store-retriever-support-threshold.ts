import { DocumentInterface } from '@langchain/core/documents'
import { BaseRetrieverInput } from '@langchain/core/retrievers'
import {
    VectorStoreRetriever,
    VectorStoreRetrieverInput,
} from '@langchain/core/vectorstores'
import { VectorStoreInterface } from '@langchain/core/vectorstores'
import { VectorStoreRetrieverMMRSearchKwargs } from '@langchain/core/vectorstores'

export type VectorStoreRetrieverSupportThresholdInput<
    V extends VectorStoreInterface,
> = BaseRetrieverInput &
    (
        | {
              vectorStore: V
              k?: number
              filter?: V['FilterType']
              searchType?: 'similarity'
              threshold?: never
          }
        | {
              vectorStore: V
              k?: number
              filter?: V['FilterType']
              searchType: 'mmr'
              searchKwargs?: VectorStoreRetrieverMMRSearchKwargs
              threshold?: never
          }
        | {
              vectorStore: V
              k?: number
              filter?: V['FilterType']
              searchType: 'threshold'
              threshold?: number
          }
    )

export class VectorStoreRetrieverSupportThreshold<
    V extends VectorStoreInterface,
> extends VectorStoreRetriever<V> {
    private threshold?: number

    constructor(fields: VectorStoreRetrieverSupportThresholdInput<V>) {
        super(fields as VectorStoreRetrieverInput<V>)
        this.threshold = fields?.threshold
    }

    async _getRelevantDocuments(
        query: string,
        runManager?: any
    ): Promise<DocumentInterface[]> {
        if (this.searchType === 'threshold') {
            return this.searchWithThreshold(query, runManager)
        }
        if (this.searchType === 'mmr') {
            return this.mmrSearch(query, runManager)
        }
        return this.similaritySearch(query, runManager)
    }

    private searchWithThreshold(
        query: string,
        runManager?: any
    ): Promise<DocumentInterface[]> {
        if (!this.threshold) {
            throw new Error('Threshold is not set')
        }
        return this.vectorStore
            .similaritySearchWithScore(
                query,
                this.k,
                this.filter,
                runManager?.getChild('vectorstore')
            )
            .then(this.filterResults.bind(this))
            .then(this.mapDocuments.bind(this))
    }

    private mmrSearch(
        query: string,
        runManager?: any
    ): Promise<DocumentInterface[]> {
        if (typeof this.vectorStore.maxMarginalRelevanceSearch !== 'function') {
            throw new Error(
                `The vector store backing this retriever, ${this._vectorstoreType()} does not support max marginal relevance search.`
            )
        }
        return this.vectorStore.maxMarginalRelevanceSearch(
            query,
            {
                k: this.k,
                filter: this.filter,
                ...this.searchKwargs,
            },
            runManager?.getChild('vectorstore')
        )
    }

    private similaritySearch(
        query: string,
        runManager?: any
    ): Promise<DocumentInterface[]> {
        return this.vectorStore.similaritySearch(
            query,
            this.k,
            this.filter,
            runManager?.getChild('vectorstore')
        )
    }

    private filterResults(
        results: [DocumentInterface, number][]
    ): [DocumentInterface, number][] {
        return results.filter(result => {
            const distance = 1 - result[1]
            return distance >= this.threshold!
        })
    }

    private mapDocuments(
        results: [DocumentInterface, number][]
    ): DocumentInterface[] {
        return results.map(result => result[0])
    }
}
