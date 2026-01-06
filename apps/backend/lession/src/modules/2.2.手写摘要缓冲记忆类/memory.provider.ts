import {
    BaseChatMessageHistory,
    InMemoryChatMessageHistory,
} from '@langchain/core/chat_history'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import {
    Runnable,
    RunnableBinding,
    RunnableConfig,
    RunnableLambda,
    RunnablePassthrough,
    RunnableSequence,
    RunnableWithMessageHistory,
} from '@langchain/core/runnables'
import { Injectable } from '@nestjs/common'
import { BaseRun } from 'langsmith/schemas'

type RWMHConstructor<RunInput, RunOutput> = new (
    ...args: ConstructorParameters<
        typeof RunnableWithMessageHistory<RunInput, RunOutput>
    >
) => RunnableWithMessageHistory<RunInput, RunOutput>

@Injectable()
export class Memory {
    constructor(
        private readonly RunnableWithMessageHistory: RWMHConstructor<any, any>
    ) {
        this.historyBySessionId = {}
    }

    private historyBySessionId: Record<string, InMemoryChatMessageHistory> = {}

    private getHistory(sessionId: string) {
        this.historyBySessionId[sessionId] =
            this.historyBySessionId[sessionId] ??
            new InMemoryChatMessageHistory()
        return this.historyBySessionId[sessionId]
    }

    wrap<RunInput, RunOutput>(
        input: Runnable<RunInput, RunOutput>
    ): RunnableWithMessageHistory<RunInput, RunOutput> {
        return new this.RunnableWithMessageHistory({
            runnable: input,
            getMessageHistory: (sessionId: string) =>
                this.getHistory(sessionId),
            inputMessagesKey: 'question',
            historyMessagesKey: 'history',
        })
    }
}

class CustomRunnableWithMessageHistory<
    RunInput,
    RunOutput,
> extends RunnableBinding<RunInput, RunOutput> {
    constructor(
        private _config: {
            runnable: Runnable<RunInput, RunOutput>
            sessionId?: string
            getMessageHistory: (sessionId: string) => BaseChatMessageHistory
            inputMessagesKey: string
            historyMessagesKey: string
        }
    ) {
        const { historyMessagesKey, runnable } = _config

        // 获取并向后传递历史记录的Runnable
        const passhistory = RunnablePassthrough.assign<any, any>({
            [historyMessagesKey]: RunnableLambda.from(
                async (_, config) => await this.getHistory(config)
            ),
        })

        // 创建新的Runnable
        const withHistory = RunnableSequence.from<RunInput, RunOutput>([
            passhistory,
            runnable,
        ])

        // 添加监听器管理历史记录
        const withListeners = withHistory.withListeners({
            onEnd: (run, config) => {
                if (!config) {
                    throw new Error('config is required')
                }
                return this.saveChat(run, config)
            },
        })

        // 调用RunnableBinding父类并传入我们整理好的配置
        super({
            bound: withListeners,
            config: { configurable: _config },
        })
    }

    private async getHistory(config: RunnableConfig<any>) {
        const { sessionId, getMessageHistory } = config.configurable!
        const history = await getMessageHistory(sessionId)
        const messages = await history.getMessages()
        // eslint-disable-next-line no-console
        console.log('history:', messages)
        return messages
            .map(message => `${message.type}: ${message.content}`)
            .join('\n')
    }

    private async saveChat(run: BaseRun, config: RunnableConfig<any>) {
        const { sessionId, getMessageHistory } = config.configurable!
        const history = await getMessageHistory(sessionId)
        const input = this.getInputMessage(run, config)
        const output = this.getOutputMessage(run)
        return history.addMessages([input, output])
    }

    private getInputMessage(run: BaseRun, config: RunnableConfig<any>) {
        const { inputMessagesKey } = config.configurable!
        if (!run?.inputs?.[inputMessagesKey]) {
            throw new Error(
                `找不到用户输入内容 run.inputs.${inputMessagesKey}}`
            )
        }
        return new HumanMessage(run.inputs[inputMessagesKey])
    }

    private getOutputMessage(run: BaseRun) {
        if (!run?.outputs?.content) {
            throw new Error('找不到AI的输出内容 run.outputs.content')
        }
        return new AIMessage(run.outputs?.content ?? '')
    }
}

export const MemoryProviderUseRunnableWithMessageHistory = {
    provide: 'MemoryByRunnableWithMessageHistory',
    useFactory: () => new Memory(RunnableWithMessageHistory),
}

export const MemoryProviderUseCustomRunnableWithMessageHistory = {
    provide: 'MemoryByCustomRunnableWithMessageHistory',
    useFactory: () => new Memory(CustomRunnableWithMessageHistory as any),
}
