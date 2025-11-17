import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { BaseMessageLike, HumanMessage } from '@langchain/core/messages'
import { ChatPromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts'
import { Inject, Injectable } from '@nestjs/common'

process.env.OPENAI_API_KEY = 'your-api-key'

let history: BaseMessageLike[] = []

const template = ChatPromptTemplate.fromMessages([SystemMessagePromptTemplate.fromTemplate(`你是教师{name},主要负责{course}教学`)])

@Injectable()
export class AppService {
  private model: BaseChatModel

  constructor(@Inject('LLMModel') llmModel: BaseChatModel) {
    this.model = llmModel
  }
  getHello() {
    return 'Hello World!'
  }
  //langchain基础使用
  async completeMessage(message: string) {
    return await this.model.invoke(message)
  }

  //提示词基础使用
  async completeMessageWithPrompt(name: string, course: string, message: string) {
    if (!history.length) {
      const value = await template.invoke({ name, course })
      history = history.concat(value.messages)
    }

    history.push(new HumanMessage(message))

    const message1 = ChatPromptTemplate.fromTemplate(`hahaha`)
    const test = message1 + 'haha'
    // eslint-disable-next-line no-console
    console.log(test)

    const completion = await this.model.stream(history)

    // eslint-disable-next-line no-console
    console.log(completion)

    return completion
  }

  //提示词实现了add方法
  //提示词支持管道化方式PipelinePromptTemplate
}
