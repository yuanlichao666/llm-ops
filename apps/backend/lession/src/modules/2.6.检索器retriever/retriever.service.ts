import { MultiQueryRetriever } from '@langchain/classic/retrievers/multi_query'
import { Document } from '@langchain/core/documents'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableLambda } from '@langchain/core/runnables'
import { RunnableConfig } from '@langchain/core/runnables'
import { RunnablePassthrough } from '@langchain/core/runnables'
import { VectorStore } from '@langchain/core/vectorstores'
import { Inject, Injectable } from '@nestjs/common'

import { Memory } from '../2.2.手写摘要缓冲记忆类/memory.provider'
import { VectorStoreSupportThreshold } from './extends/vector-store-support-threshold'
import { SimpleCustomRetriever } from './retrievers/simple-custom-retriever'

@Injectable()
export class RetrieverService {
    constructor(
        @Inject('Memory') private memory: Memory,
        @Inject('ChatModel') private chatModel: BaseChatModel,
        @Inject('VectorStore')
        private vectorStore: VectorStoreSupportThreshold
    ) {}

    async queryWithDefaultConfig(query: string) {
        const baseRetriever = RunnableLambda.from(
            async (
                _: string,
                config: RunnableConfig<Parameters<VectorStore['asRetriever']>>
            ) => {
                return this.vectorStore.asRetriever(
                    ...(Object.values(config.configurable!) as any)
                )
            }
        )

        const withConfig = baseRetriever.withConfig({
            configurable: [
                {
                    k: 5,
                    searchType: 'threshold',
                    threshold: 0.5,
                },
            ],
        })

        const results = await withConfig.invoke(query)
        return results
    }

    async queryWithCustomRetriever(query: string) {
        const customRetriever = new SimpleCustomRetriever()
        return await customRetriever.invoke(query)
    }

    async firstAgent(message: string) {
        const systemMessage =
            '你是一个助手，请回答用户的问题\n' +
            'context: {context}\n' +
            'history: {history}'

        const prompt = ChatPromptTemplate.fromMessages([
            { role: 'system', content: systemMessage },
            { role: 'user', content: '{question}' },
        ])

        const retrieve = RunnableLambda.from<{ question: string }, string>(
            ({ question }) =>
                this.vectorStore
                    .asRetriever({
                        k: 20,
                    })
                    .invoke(question)
                    .then(combineDocuments)
        )
        const passContext = RunnablePassthrough.assign({ context: retrieve })

        const withHistoryAndContext = this.memory.wrap(
            passContext.pipe(prompt).pipe(this.chatModel)
        )

        return withHistoryAndContext.invoke(
            { question: message },
            { configurable: { sessionId: '123' } }
        )
    }

    async multiQueryRetriever(query: string) {
        const retriever = MultiQueryRetriever.fromLLM({
            llm: this.chatModel,
            retriever: this.vectorStore.asRetriever({
                searchType: 'threshold',
                threshold: 0.8,
                k: 20,
            }),
        })
        const results = await retriever.invoke(query, {
            configurable: {
                temperature: 0,
            },
        })
        return results
    }
}

function combineDocuments(documents: Document[]) {
    return documents.map(doc => doc.pageContent).join('\n')
}
