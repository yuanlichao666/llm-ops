import { Inject, Injectable } from '@nestjs/common'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

import { concatTemplate } from '../../helpers/concatTemplate'

const toolByName = {
    getWeather: (city: string) => {
        return `The weather in ${city} is sunny`
    },
}

const toolInfos = [
    {
        name: 'getWeather',
        example: "getWeather('Beijing')",
        description: 'Get the weather of a city',
        parameters: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'The city to get the weather of',
                },
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
export class ToolCallByPromptService {
    constructor(@Inject('OpenAI') private readonly openai: OpenAI) {}

    async toolCallByPrompt(message: string) {
        // 1. 构建系统提示词,告诉模型可以调用工具、以及返回的格式
        const outputExample = {
            tool_name: 'xxx',
            tool_params: {
                xxx: 'yyy',
            },
        }
        const systemPrompt = concatTemplate(
            '你是一个助手，在回答问题之前请先检查工具列表，如果有需要，请调用工具\n',
            `工具列表如下：\n${toolInfos.map(JSON.stringify as any).join('\n')}`,
            '如果需要调用工具，请返回json格式，格式如下：',
            JSON.stringify(outputExample)
        )

        // 2. 构建消息列表,包括系统提示词和用户提示词
        let messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
        ]

        // 3. 调用模型，获取模型返回的结果
        const completion = await this.openai.chat.completions.create({
            model: 'kimi-k2-thinking-251104', // 注意：确保 baseURL 和模型匹配
            messages,
        })
        // 4. 解析模型返回的结果，如果结果是json格式，则调用工具,否则直接返回
        const result = completion.choices[0].message.content
        let json: Record<string, any>
        try {
            json = JSON.parse(result!) as any
        } catch {
            return completion.choices[0].message.content
        }

        // 5. 调用工具，获取工具返回的结果
        const toolResult = toolExecuter(json.tool_name, json.tool_params)
        // 6. 构建消息列表，包括工具调用结果和系统提示词
        messages = messages.concat([
            {
                role: 'assistant',
                content: concatTemplate(
                    '工具调用：\n',
                    JSON.stringify(toolResult)
                ),
            },
            {
                role: 'system',
                content: concatTemplate(
                    '工具调用结果：\n',
                    JSON.stringify(toolResult.result)
                ),
            },
        ])
        // 7. 再次调用模型，获取模型返回的结果
        // eslint-disable-next-line no-console
        console.log(messages)
        const completion2 = await this.openai.chat.completions.create({
            model: 'kimi-k2-thinking-251104', // 注意：确保 baseURL 和模型匹配
            messages,
        })
        return completion2
    }
}
