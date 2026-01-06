import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'

import { FusionMultiQueryRetriever } from '../retrievers/fusion-retriever'

export const FusionMultiQueryRetrieverProvider = {
    provide: 'FusionRetriever',
    useFactory: (
        chatModel: BaseChatModel,
        sourceRetriever: VectorStoreRetriever
    ) => {
        return FusionMultiQueryRetriever.fromLLM({
            k: 4,
            llm: chatModel,
            retriever: sourceRetriever,
        })
    },
    inject: ['ChatModel', 'BaseRetriever'],
}
