import { Document } from '@langchain/core/documents'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { BaseRetriever } from '@langchain/core/retrievers'

import { concatTemplate } from '../../../helpers/concatTemplate'

export class HybridRetriever extends BaseRetriever {
    lc_namespace: string[] = ['HybridRetriever']

    constructor(
        private readonly llm: BaseChatModel,
        private readonly retriever: BaseRetriever
    ) {
        super()
    }

    private readonly prompt = PromptTemplate.fromTemplate<{
        question: string
    }>(
        concatTemplate([
            '请写一篇科学论文来回答这个问题。',
            '这是问题: {question}',
            '请给出文章',
        ])
    )

    async _getRelevantDocuments(question: string): Promise<Document[]> {
        return await this.prompt
            .pipe(this.llm)
            .pipe(new StringOutputParser())
            .pipe(this.retriever)
            .invoke({ question })
    }
}
