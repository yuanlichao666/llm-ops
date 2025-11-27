import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import {
  RunnableBinding,
  RunnableBranch,
  RunnableConfig,
  RunnableLambda,
  RunnableMap,
  RunnableParallel,
  RunnableSequence,
} from '@langchain/core/runnables'
import { Inject, Injectable } from '@nestjs/common'
import { from } from 'rxjs'

@Injectable()
export class LangchainBasicService {
  constructor(@Inject('ChatModel') private readonly chatModel: BaseChatModel) {}

  async invoke(message: string) {
    return this.chatModel.invoke([{ role: 'user', content: message }])
  }

  async stream(message: string) {
    return this.chatModel.stream([{ role: 'user', content: message }])
  }

  async message(message: string) {
    const systemMessage = new SystemMessage({
      content: '你是一个助手，请回答用户的问题',
    })
    const userMessage = new HumanMessage({
      content: message,
    })
    return this.chatModel.stream([systemMessage, userMessage])
  }
  async promptTemplate(message: string) {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', '你是一个助手，请回答用户的问题'],
      ['user', '{input}'],
    ])
    const messages = await prompt.invoke({ input: message })

    return this.chatModel.stream(messages)
  }

  async runnableSequence(message: string) {
    const chain = RunnableSequence.from([
      async (input: string) => {
        return { input }
      },
      ChatPromptTemplate.fromMessages([['user', '{input}']]),
      this.chatModel,
    ])
    return chain.stream(message)
  }

  async pipe(message: string) {
    function sequence(input: string) {
      return { input }
    }
    const chain = RunnableLambda.from(sequence)
      .pipe(
        ChatPromptTemplate.fromMessages([
          ['system', '你是一个助手，请回答用户的问题'],
          ['user', '{input}'],
        ])
      )
      .pipe(this.chatModel)
    return chain.stream(message)
  }

  async runnableParallel(user: { name: string; age: number }) {
    const sequenceName = RunnableLambda.from(
      async (input: { name: string; age: number }) => {
        return input.name
      }
    )
    const sequenceAge = RunnableLambda.from(
      async (input: { name: string; age: number }) => {
        return input.age
      }
    )
    const chain = RunnableParallel.from({
      name: sequenceName,
      age: sequenceAge,
    })
      .pipe(
        ChatPromptTemplate.fromMessages([
          { role: 'system', content: '你是一个助手，请回答用户的问题' },
          { role: 'user', content: '用户的信息是{name}, {age}' },
          { role: 'user', content: '用户的名称是什么？年龄是多少？' },
        ])
      )
      .pipe(this.chatModel)

    return chain.stream(user)
  }

  async runnableMap(user: { name: string; age: number }) {
    // runnablemap和parallel很像，但又有一定区别
    // parallel的输入是可以是任意值，这个值会原样交给parallel中的每个runnable执行
    // 而map的输入必须是个对象，会取出每个key交给map中对应的runnable执行
    // 输出都是一样的，最后合并结果返回一个对象
    const chain = RunnableMap.from({
      name: RunnableLambda.from(
        async (input: { name: string; age: number }) => input.name
      ),
      age: RunnableLambda.from(
        async (input: { name: string; age: number }) => input.age
      ),
    })
      .pipe(
        ChatPromptTemplate.fromMessages([
          { role: 'system', content: '你是一个助手，请回答用户的问题' },
          { role: 'user', content: '用户的信息是{name}, {age}' },
          { role: 'user', content: '用户的名称是什么？年龄是多少？' },
        ])
      )
      .pipe(this.chatModel)
    return chain.stream(user)
  }

  // 利用invok动态修改配置
  // runnable在构造函数中会接受配置字段
  // 在执行时可以将当期的config传给invoke方法合并两个配置
  async dynamicConfig(message: string) {
    const prompt = ChatPromptTemplate.fromMessages([
      { role: 'system', content: '你是一个助手，请回答用户的问题' },
      { role: 'user', content: '{message}' },
    ])
    const chain = prompt
      .pipe(this.chatModel)
      .stream({ message }, { configurable: { stop: ['小'] } }) //配置停止词，月之暗面下不知道为啥不生效
    return chain
  }

  // 利用withConfig预构建链--model
  // 原理：withConfig方法会返回一个新对象，新对象会包含原来的配置和新的配置
  // 在执行时会将当期的config传给invoke方法，于是两个config会合并
  async prebuiltModel(message: string) {
    const prompt = ChatPromptTemplate.fromMessages([
      {
        role: 'system',
        content:
          '你正在执行一项测试，请重复用户传递的内容，除了重复其他均不要操作,直到出现停止词',
      },
      { role: 'user', content: '{message}' },
    ])
    const sourceChain = this.chatModel
    const withMonitor = sourceChain.withConfig({
      callbacks: [
        {
          handleLLMEnd: output => {
            // eslint-disable-next-line no-console
            console.log('handleLLMEnd', output)
            return output
          },
          handleLLMError: error => {
            // eslint-disable-next-line no-console
            console.log('handleLLMError', error)
            return error
          },
          handleLLMStart: input => {
            // eslint-disable-next-line no-console
            console.log('handleLLMStart', input)
            return input
          },
        },
      ],
    })
    return RunnableSequence.from([prompt, withMonitor]).stream({ message })
  }

  // 利用withConfig预构建链--lambda
  async prebuiltLambda(user: { name: string; age: number }) {
    type InputConfig = RunnableConfig<{ kwargs: { age: number } }>

    // 给sourceInput定义输入配置
    const sourceInput = RunnableLambda.from(
      async (name: string, config: InputConfig) => {
        return { name, age: config.configurable?.kwargs?.age }
      }
    )

    // 应用自定义配置到sourceInput
    const withName = sourceInput.withConfig({
      configurable: {
        kwargs: {
          age: user.age,
        },
      },
    })

    const prompt = ChatPromptTemplate.fromMessages([
      { role: 'system', content: '你是一个助手，请回答用户的问题' },
      { role: 'user', content: '用户的信息是{name}, {age}' },
    ])

    const chain = withName.pipe(prompt).pipe(this.chatModel)

    return chain.stream(user.name)
  }

  // 预构建template , 利用partial (js版template不支持config)
  async prebuiltTemplate(message: string, role: string) {
    const sourcePrompt = ChatPromptTemplate.fromMessages([
      ['system', '你是一位{role}，请回答用户的问题'],
      ['user', '{message}'],
    ])
    const prebuiltPrompt = await sourcePrompt.partial({ role })
    return RunnableSequence.from([prebuiltPrompt, this.chatModel]).stream({
      message,
    })
  }

  // 利用runnableBranch动态选择组件
  async dyncmicComponentByRunnableBranch(userInput: {
    topic: string
    question: string
  }) {
    const defaultPrompt = ChatPromptTemplate.fromMessages([
      { role: 'system', content: '你是一个助手，请回答用户的问题' },
      { role: 'user', content: '{message}' },
    ])
    const alternatePrompt = ChatPromptTemplate.fromMessages([
      { role: 'system', content: '你是一个助手，请重复用户的问题' },
      { role: 'user', content: '{message}' },
    ])

    const condition = ({ topic }) => topic === 'repeat'

    const edges = RunnableBranch.from([
      [condition, alternatePrompt],
      defaultPrompt,
    ])

    return RunnableSequence.from([edges, this.chatModel]).stream(userInput)
  }

  // 利用runnableLambda动态选择组件
  async dyncmicComponentByRunnableLambda(userInput: {
    topic: string
    question: string
  }) {
    const defaultPrompt = ChatPromptTemplate.fromMessages([
      { role: 'system', content: '你是一个助手，请回答用户的问题' },
      { role: 'user', content: '{message}' },
    ])
    const alternatePrompt = ChatPromptTemplate.fromMessages([
      { role: 'system', content: '你是一个助手，请重复用户的问题' },
      { role: 'user', content: '{message}' },
    ])
    const selectPrompt = RunnableLambda.from(
      (_, config: RunnableConfig<{ topic?: string }>) => {
        if (config.configurable?.topic === 'repeat') {
          return alternatePrompt
        }
        return defaultPrompt
      }
    )
    const sourceChain = RunnableSequence.from([selectPrompt, this.chatModel])

    const answerChain = sourceChain.withConfig({
      configurable: {
        topic: 'answer',
      },
    })
    const repeatChain = sourceChain.withConfig({
      configurable: {
        topic: 'repeat',
      },
    })

    const answerStream = await answerChain.stream(userInput)
    const repeatStream = await repeatChain.stream(userInput)

    from(answerStream).subscribe(chunk => {
      // eslint-disable-next-line no-console
      console.log('answer', chunk)
    })

    return repeatStream
  }

  // 配置:生命周期
  async config_lifecycle(message: string) {
    const chain = this.chatModel.withConfig({
      configurable: {
        lifecycle: {
          before: [
            () => {
              // eslint-disable-next-line no-console
              console.log('before')
            },
          ],
          after: [
            () => {
              // eslint-disable-next-line no-console
              console.log('after')
            },
          ],
        },
      },
    })
    return chain.stream(message)
  }

  // 只支持invok的retry，对于流式还是没支持，需要rxjs
  async withRetry(message: string) {
    const input = RunnableLambda.from(maybeError).withRetry({
      stopAfterAttempt: 3,
    })
    const prompt = ChatPromptTemplate.fromMessages([
      { role: 'system', content: '你是一个助手，请回答用户的问题' },
      { role: 'user', content: '{message}' },
    ])
    const chain = input.pipe(prompt).pipe(this.chatModel)
    return chain.invoke(message)
  }

  async runnableBinding(message: string) {
    const sourceChain = RunnableLambda.from(
      async (input: string, config: RunnableConfig<{ sessionId: string }>) => {
        // eslint-disable-next-line no-console
        console.log('config:', config, 'input:', input)
        return input
      }
    )
    const bindingChain = new RunnableBinding<
      string,
      string,
      RunnableConfig<{ sessionId: string }>
    >({
      bound: sourceChain,
      config: {
        configurable: {
          sessionId: '123',
        },
      },
    })
    return bindingChain.stream(message)
  }
}

let count = 0
function maybeError(message: string) {
  if (count % 2 === 0) {
    // eslint-disable-next-line no-console
    console.log('抛出错误')
    count++
    throw new Error('error')
  } else {
    // eslint-disable-next-line no-console
    console.log('执行了', count + 1, '次')
    count++
    return { message }
  }
}
