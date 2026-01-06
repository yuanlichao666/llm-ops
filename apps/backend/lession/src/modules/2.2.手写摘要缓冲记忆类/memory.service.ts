import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { Inject, Injectable } from '@nestjs/common'

import { Memory } from './memory.provider'

@Injectable()
export class LangchainMemoryService {
    constructor(
        @Inject('ChatModel') private readonly chatModel: BaseChatModel,
        @Inject('MemoryByRunnableWithMessageHistory')
        private readonly memory: Memory,
        @Inject('MemoryByCustomRunnableWithMessageHistory')
        private readonly customMemory: Memory
    ) {}

    async runnableWithBasicMemory(message: string, sessionId: string) {
        const prompt = ChatPromptTemplate.fromMessages([
            {
                role: 'system',
                content: '你是一个助手，请回答用户的问题',
            },
            new MessagesPlaceholder('history'),
            { role: 'user', content: '{question}' },
        ])
        const chain = RunnableSequence.from([prompt, this.chatModel])
        return this.memory
            .wrap(chain)
            .stream({ question: message }, { configurable: { sessionId } })
    }

    async runnableWithCustomMemory(message: string, sessionId: string) {
        const prompt = ChatPromptTemplate.fromMessages([
            { role: 'system', content: '你是一个助手，请回答用户的问题' },
            { role: 'system', content: '你的历史记录是{history}' },
            { role: 'user', content: '{question}' },
        ])
        const chain = RunnableSequence.from([prompt, this.chatModel])
        return this.customMemory
            .wrap(chain)
            .stream({ question: message }, { configurable: { sessionId } })
    }
}
