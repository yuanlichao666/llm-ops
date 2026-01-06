import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'

import { StepBackRetriever } from '../retrievers/step-back-retriever'

export const StepBackRetrieverProvider = {
    provide: 'StepBackRetriever',
    useFactory: (llm: BaseChatModel, sourceRetriever: VectorStoreRetriever) => {
        return new StepBackRetriever(llm, sourceRetriever)
    },
    inject: ['ChatModel', 'BaseRetriever'],
}
