import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { BaseRetriever } from '@langchain/core/retrievers'

import { HybridRetriever } from '../retrievers/hybrid-retriever'

export const HybridRetrieverProvider = {
    provide: 'HybridRetriever',
    useFactory: (llm: BaseChatModel, retriever: BaseRetriever) => {
        return new HybridRetriever(llm, retriever)
    },
    inject: ['ChatModel', 'BaseRetriever'],
}
