import { renderTextDescriptionAndArgs } from '@langchain/classic/tools/render'
import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search'
import { SerpAPI } from '@langchain/community/tools/serpapi'
import { Serper } from '@langchain/community/tools/serper'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import {
    Runnable,
    RunnableLambda,
    RunnableSequence,
} from '@langchain/core/runnables'
import { Tool } from '@langchain/core/tools'
import { convertToOpenAITool } from '@langchain/core/utils/function_calling'
import { Inject, Injectable } from '@nestjs/common'
import {
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    tool,
    ToolMessage,
} from 'langchain'
import lodash from 'lodash'
import * as z from 'zod'

import { gaoDeWeather } from './tools/gaode-weather'

@Injectable()
export class LangchainToolsService {
    private readonly duckduckgoSearch: DuckDuckGoSearch
    constructor(
        @Inject('SerpApi') private readonly serpApi: SerpAPI,
        @Inject('ChatModel') private readonly chatModel: BaseChatModel
    ) {
        this.duckduckgoSearch = new DuckDuckGoSearch({ maxResults: 1 })
    }
    // 国内用不了
    useduckduckgoSearch(message: string) {
        return this.duckduckgoSearch.invoke(message)
    }

    useSerp(message: string) {
        const apiKey = 'f1f254a10facf61cc01b8405b1d7f467a72df46d'
        const tool = new Serper(apiKey)
        // console.log(convertToOpenAITool(tool))
        return tool.invoke(message)
    }

    useSerpApi(message: string) {
        // console.log(this.serpApi.name)
        // console.log(this.serpApi.description)
        // console.log(this.serpApi.schema)

        // const tool = convertToOpenAITool(this.serpApi)
        // console.log(tool)

        return this.serpApi.invoke(message)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    customToolBySchema(message: string) {
        const mytool = tool(
            ({ city }: { city: string }) => {
                return `The weather in ${city} is sunny`
            },
            {
                name: 'getWeather',
                description: 'Get the weather of a city',
                schema: z.object({
                    city: z.string().describe('The city to get the weather of'),
                }),
            }
        )

        return mytool.invoke({
            city: 'Beijing',
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    customToolByClass(message: string) {
        class MyTool extends Tool {
            name = 'getWeather'
            description = 'Get the weather of a city'

            protected async _call(
                arg: string | undefined
                // runManager?: CallbackManagerForToolRun,
                // parentConfig?: ToolRunnableConfig
            ) {
                return `The weather in ${arg} is sunny`
            }
        }
        const mytool = new MyTool()
        return mytool.invoke('Beijing')
    }

    useGaoDeWeather(message: string) {
        return gaoDeWeather.invoke({ city: message })
    }

    async bindTools(message: string) {
        const tools: Runnable[] = [this.serpApi, gaoDeWeather]
        const toolByName = Object.fromEntries(
            tools.map(tool => [tool.name, tool])
        )

        const modelWithTools = this.chatModel.bindTools!(
            tools.map(convertToOpenAITool)
        )

        const messages: BaseMessage[] = [
            new SystemMessage('你是一个助手，请回答用户的问题'),
            new HumanMessage(message),
        ]
        const chain = RunnableSequence.from([
            ChatPromptTemplate.fromMessages(messages),
            modelWithTools,
        ])
        const answer = await chain.invoke({})

        if (!answer.tool_calls) {
            return new StringOutputParser().invoke(answer)
        }

        // 将模型返回的 AIMessage 添加到消息历史中（包含 tool_calls）
        messages.push(answer)

        for (const call of answer.tool_calls) {
            const { name, args, id } = call
            const tool = toolByName[name]
            const content = await tool.invoke(args)
            messages.push(new ToolMessage(content, id!))
        }

        return RunnableSequence.from([
            ChatPromptTemplate.fromMessages(messages),
            modelWithTools,
            new StringOutputParser(),
        ]).invoke(null)
    }

    // 如果模型不支持函数调用，可以通过这个api将工具渲染成提示词
    // 通过提示实现函数调用
    async renderTextToolInfo() {
        const toolInfo = renderTextDescriptionAndArgs([
            gaoDeWeather,
            this.serpApi,
        ])
        return toolInfo
    }

    //错误处理机制：携带错误信息尝试自修复 & 使用更强大的模型,场景不好举例，后面载研究吧
    async errorRetryStrategy(message: string) {
        let messages: BaseMessage[] = [
            new SystemMessage(
                '你是一个助手，请回答用户的问题,如果工具调用出现错误，请尝试修复'
            ),
            new HumanMessage(message),
        ]
        //失败时返回正确的使用说明
        const mockWeather = tool(
            (params: Record<string, string>) => {
                if (!params.p1 || !params.p2) {
                    throw new Error(
                        '执行失败：参数必须为多个城市字符串，例如{p1:string,p2:string,pn...}'
                    )
                }
                return params.p1 + params.p2 + 'is sunny'
            },
            {
                name: 'getWeather',
                description: 'Get the weather of tow city',
                schema: z.object({
                    p1: z.string().describe('The first city').optional(),
                    p3: z.string().describe('The second city').optional(),
                    p2: z.string().describe('The third city').optional(),
                }),
            }
        )

        const lowerModel = this.chatModel.bindTools!([mockWeather])
        const heigerModel = this.chatModel

        const executeTool = async (aiMessage: AIMessage) => {
            const toolCallResults = await Promise.all(
                aiMessage.tool_calls!.map(call =>
                    mockWeather
                        .invoke(call.args as any)
                        .then(res => ({
                            name: call.name,
                            content: res,
                            tool_call_id: call.id!,
                        }))
                        .catch(err => {
                            throw new ToolExecption(
                                call.id!,
                                call.name!,
                                err instanceof Error
                                    ? err.message
                                    : 'Unknown error'
                            )
                        })
                )
            )
            const toolCallMessages = toolCallResults.map(result => {
                return new ToolMessage(
                    result.content,
                    result.tool_call_id!,
                    result.name!
                )
            })
            return toolCallMessages
        }

        const chain = RunnableSequence.from([
            RunnableLambda.from(() =>
                ChatPromptTemplate.fromMessages(messages)
            ),

            RunnableLambda.from((_, config) => {
                const model = lodash.get(
                    config,
                    'configurable.model',
                    lowerModel
                )
                return model || lowerModel
            }),
        ])

        const chainWithExecuter = chain.pipe(async aIMessage => {
            messages.push(aIMessage)

            if (aIMessage.tool_calls?.length) {
                return await executeTool(aIMessage)
                    .then(toolCallResults => {
                        messages = [...messages, ...toolCallResults]
                    })
                    .catch(err => {
                        messages.push(new ToolMessage(err.message, err.id))
                        throw new ToolExecption(err.id, err.name, err.message)
                    })
            }

            return new StringOutputParser().invoke(aIMessage)
        })

        // 这里我们使用了更强大的模型，并且message中已经存在了错误信息，尝试让模型自修复
        return chainWithExecuter
            .withFallbacks([
                chainWithExecuter.withConfig({
                    configurable: { model: heigerModel },
                }),
            ])
            .invoke(null)
    }

    //多模态输入
    async multiModalInput(message: string, image: string) {
        const messages: BaseMessage[] = [
            new SystemMessage(
                '你是一个助手，请回结合上下文和工具调用结果答用户的问题'
            ),
            new HumanMessage([
                {
                    type: 'text',
                    text: message,
                },
                {
                    type: 'image_url',
                    image_url: image,
                },
            ]),
        ]
        const chain = RunnableSequence.from([
            RunnableLambda.from(() =>
                ChatPromptTemplate.fromMessages(messages)
            ),
            this.chatModel.bindTools!([gaoDeWeather, this.serpApi]),
        ])

        const executer = (aiMessage: AIMessage) => {
            return Promise.all(
                aiMessage.tool_calls!.map(call =>
                    gaoDeWeather
                        .invoke(call.args as any)
                        .then(res => new ToolMessage(res, call.id!))
                )
            )
        }

        for (let i = 0; i < 4; i++) {
            const aiMessage = await chain.invoke(null)
            messages.push(aiMessage)

            if (!aiMessage.tool_calls?.length) {
                break
            }

            const toolCallResults = await executer(aiMessage)
            messages.push(...toolCallResults)
            continue
        }
        return new StringOutputParser().invoke(messages.pop()!)
    }

    //接入文生图
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async textToImage(message: string) {
        // const messages: BaseMessage[] = [
        //     new SystemMessage(
        //         '你是一个助手，请结合上下文和工具调用结果答用户的问题'
        //     ),
        //     new HumanMessage(message),
        // ]
    }
}
class ToolExecption extends Error {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly message: string
    ) {
        super(message)
    }
}
