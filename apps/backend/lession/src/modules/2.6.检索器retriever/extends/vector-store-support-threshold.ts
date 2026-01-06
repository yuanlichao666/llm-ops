import { Callbacks } from '@langchain/core/callbacks/manager'
import { VectorStore } from '@langchain/core/vectorstores'

import {
    VectorStoreRetrieverSupportThreshold,
    VectorStoreRetrieverSupportThresholdInput,
} from './vector-store-retriever-support-threshold'

type ConstructorOf<Klass> = new (...args: any[]) => Klass

type AsRetriever<T extends VectorStore> = (
    kOrFields?: number | Partial<VectorStoreRetrieverSupportThresholdInput<T>>,
    filter?: T['FilterType'],
    callbacks?: Callbacks,
    tags?: string[],
    metadata?: Record<string, unknown>,
    verbose?: boolean
) => VectorStoreRetrieverSupportThreshold<T>

export function SupportThreshold<T extends VectorStore>(
    Constructor: ConstructorOf<T>
) {
    // @ts-expect-error - Mixin 模式的类型推断限制
    class SupportThreshold extends Constructor {
        asRetriever: AsRetriever<T> = (
            kOrFields?:
                | number
                | Partial<VectorStoreRetrieverSupportThresholdInput<T>>,
            filter?: this['FilterType'],
            callbacks?: Callbacks,
            tags?: string[],
            metadata?: Record<string, unknown>,
            verbose?: boolean
        ) => {
            if (typeof kOrFields === 'number') {
                return new VectorStoreRetrieverSupportThreshold<T>({
                    vectorStore: this as any,
                    k: kOrFields,
                    filter,
                    tags: [...(tags ?? []), this._vectorstoreType()],
                    metadata,
                    verbose,
                    callbacks,
                })
            } else {
                const params = {
                    vectorStore: this,
                    k: kOrFields?.k,
                    filter: kOrFields?.filter,
                    tags: [...(kOrFields?.tags ?? []), this._vectorstoreType()],
                    metadata: kOrFields?.metadata,
                    verbose: kOrFields?.verbose,
                    callbacks: kOrFields?.callbacks,
                    searchType: kOrFields?.searchType,
                    threshold: kOrFields?.threshold,
                }
                if (kOrFields?.searchType === 'mmr') {
                    return new VectorStoreRetrieverSupportThreshold<T>({
                        ...params,
                        searchKwargs: kOrFields.searchKwargs,
                    } as any)
                }
                return new VectorStoreRetrieverSupportThreshold<T>({
                    ...params,
                } as any)
            }
        }
    }

    return SupportThreshold as unknown as ConstructorOf<
        T & { asRetriever: AsRetriever<T> }
    >
}

export type VectorStoreSupportThreshold<T extends VectorStore = VectorStore> =
    T & { asRetriever: AsRetriever<T> }
