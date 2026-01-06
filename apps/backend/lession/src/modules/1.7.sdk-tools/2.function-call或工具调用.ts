import { Inject, Injectable } from '@nestjs/common'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const toolByName = {
    getWeather: (city: string) => {
        return `The weather in ${city} is sunny`
    },
}

const toolInfos: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'getWeather',
            description: 'Get the weather of a city',
            parameters: {
                type: 'object',
                properties: {
                    city: {
                        type: 'string',
                        description: 'The city to get the weather of',
                    },
                },
                required: ['city'],
            },
        },
    },
]

function toolExecuter(name: string, params: Record<string, string>) {
    try {
        const result = toolByName[name](Object.values(params))
        return {
            tool_name: name,
            tool_params: params,
            result,
        }
    } catch {
        throw new Error('Tool execution failed')
    }
}

@Injectable()
export class ToolCallByFunctionCallingService {
    constructor(@Inject('OpenAI') private readonly openai: OpenAI) {}

    async toolCallByFunctionCalling(message: string) {
        // 1. 构建消息列表,包括系统提示词和用户提示词
        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: '你是一个助手，请回答用户的问题' },
            { role: 'user', content: message },
        ]

        // 2. 调用绑定工具的模型，获取模型返回的结果
        const completion = await this.openai.chat.completions.create({
            model: 'doubao-1-5-pro-32k-250115',
            messages,
            tools: toolInfos,
        })

        // 3. 解析模型返回的结果，如果结果是function call，则调用工具，否则直接返回
        const functionCall = getFunctionCall(completion)
        if (!functionCall) {
            return optputString(completion)
        }
        const result = toolExecuter(functionCall.name, functionCall.arguments)

        // 4.向先前的消息列表中添加assistant消息和tool消息
        messages.push(completion.choices[0].message)
        messages.push({
            role: 'tool',
            tool_call_id: functionCall.tool_call_id,
            content: result.result,
        })

        // 5. 再次调用模型，获取模型返回的结果
        // eslint-disable-next-line no-console
        console.log(messages)
        const completion2 = await this.openai.chat.completions.create({
            model: 'kimi-k2-thinking-251104', // 注意：确保 baseURL 和模型匹配
            messages,
        })

        // 6. 返回模型返回的结果
        return optputString(completion2)
    }
}

function getFunctionCall(response: OpenAI.Chat.Completions.ChatCompletion) {
    if (response.choices[0].message.tool_calls) {
        const toolCall = response.choices[0].message.tool_calls[0]
        if (toolCall.type === 'function') {
            return {
                name: toolCall.function.name,
                tool_call_id: toolCall.id,
                arguments: JSON.parse(toolCall.function.arguments),
            }
        }
    }
}

function optputString(response: OpenAI.Chat.Completions.ChatCompletion) {
    return response.choices[0].message.content
}
