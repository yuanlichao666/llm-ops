import { Inject, Injectable } from '@nestjs/common'
import OpenAI from 'openai'
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionDeveloperMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/chat/completions'

type SupportedMessage =
  | ChatCompletionDeveloperMessageParam
  | ChatCompletionSystemMessageParam
  | ChatCompletionUserMessageParam
  | ChatCompletionAssistantMessageParam

// 聊天上下文的类型
type Context = {
  summary: string
  history: SupportedMessage[]
  prompt: ChatCompletionSystemMessageParam
}

// 大模型记忆模块的抽象接口
interface Memory {
  /**
   * 最大token数
   * @type {number}
   */
  maxTokens: number

  /**
   * 每次能够总结的最大token数
   * @type {number}
   */
  summarizeTokensOnce: number

  /**
   * 是否有上下文
   * @returns boolean
   */
  hasContext: () => boolean

  /**
   * 获取上下文
   * @returns Context
   */
  getContext: () => Context

  /**
   * 添加消息
   * @param messages: ChatCompletionMessageParam[]
   * @returns Promise<void>
   */
  saveMessage: (messages: SupportedMessage[]) => Promise<Context>
}

// 用于创建总结的客户端的抽象接口
export interface SummaryClient {
  completeSummary(context: SupportedMessage[]): Promise<string>
}

// 实现 SummaryClient 接口
@Injectable()
export class SummaryClientImpl implements SummaryClient {
  constructor(@Inject('OpenAI') private readonly openai: OpenAI) {}

  async completeSummary(context: SupportedMessage[]): Promise<string> {
    // eslint-disable-next-line no-console
    console.log('开始总结对话')
    return await this.openai.chat.completions
      .create({
        model: 'kimi-k2-turbo-preview',
        messages: [...context, { role: 'user', content: '总结一下这段对话' }],
      })
      .then(response => response.choices[0].message.content!)
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('总结对话失败', error)
        return ''
      })
      .finally(() => {
        // eslint-disable-next-line no-console
        console.log('总结对话完成')
      })
  }
}

// 大模型记忆模块的实现
@Injectable()
export class SdkMemory implements Memory {
  private readonly context: Context = {
    summary: '',
    history: [],
    prompt: { role: 'system', content: '' },
  }

  constructor(
    public readonly summarizeTokensOnce: number,
    public readonly maxTokens: number,
    private readonly summaryClient: SummaryClientImpl,
    private readonly prompt: ChatCompletionSystemMessageParam = {
      role: 'system',
      content: '',
    }
  ) {
    this.context.prompt = prompt
  }

  private computedTokens(history: SupportedMessage[]) {
    return history.reduce((acc, message) => {
      return acc + message!.content!.length
    }, 0)
  }

  private isOverflow() {
    const { history } = this.context
    const tokens = this.computedTokens(history)
    return tokens >= this.maxTokens
  }

  /**
   * 根据每次能够总结的最大token数收集需要总结的消息列表
   * @returns toBeSummarized: string[]
   */
  private sliceHistoryForSummarize() {
    const { history } = this.context
    let toBeSummarizedTokens = 0
    const toBeSummarized: SupportedMessage[] = []
    for (const message of history) {
      toBeSummarized.push(message)
      toBeSummarizedTokens += message!.content!.length
      if (toBeSummarizedTokens > this.summarizeTokensOnce) {
        break
      }
    }
    return toBeSummarized
  }

  private sliceContextForSummarize() {
    const context = { ...this.context }
    context.history = this.sliceHistoryForSummarize()
    return context
  }

  private async summarize() {
    const slicedContext = this.sliceContextForSummarize()
    const displayedContext = display(slicedContext)
    return await this.summaryClient
      .completeSummary(displayedContext)
      .then(
        newSummary => (
          this.onSummarizeSuccess(slicedContext, newSummary),
          this.context
        )
      )
  }

  private onSummarizeSuccess(slicedContext: Context, newSummary: string) {
    this.context.summary = newSummary
    this.context.history.splice(0, slicedContext.history.length)
  }

  public hasContext(): boolean {
    return this.context.history.length > 0
  }

  public getContext() {
    return this.context
  }

  public async saveMessage(messages: SupportedMessage[]) {
    this.context.history.push(...messages)
    const isOverflow = this.isOverflow()
    if (isOverflow) {
      // eslint-disable-next-line no-console
      console.log('isOverflow')
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(this.context))
      return await this.summarize()
    }
    return this.context
  }

  public displayContext() {
    // eslint-disable-next-line no-console
    console.log('displayContext', JSON.stringify(this.context))
    return display(this.context)
  }
}

// const LLMProvider = {
//   provide: 'LLMModel',
//   useFactory: async () => {
//     return await LLMFactory()
//   },
// }

export const MemoryProvider = {
  provide: 'Memory',
  useFactory: (client: SummaryClientImpl) => {
    return new SdkMemory(1000, 1000, client, {
      role: 'system',
      content:
        '你是一个助手，请回答用户的问题,用户名字叫做袁力超，他的老婆叫敏敏',
    })
  },
  inject: [SummaryClientImpl],
}

function display({ summary, history, prompt }: Context): SupportedMessage[] {
  return [
    prompt,
    { role: 'system', content: `summary: ${summary}` },
    ...history,
  ]
}
