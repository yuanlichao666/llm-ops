import { Inject, Injectable } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class ChatCompletionService {
    constructor(@Inject('OpenAI') private readonly openai: OpenAI) {}

    // chat completions api , 虽然是旧标准，但会无限期支持，大部分模型都适配了
    // https://github.com/openai/openai-node#readme

    async chatComplete(message: string) {
        const completion = await this.openai.chat.completions.create({
            model: 'kimi-k2-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一个助手，请回答用户的问题,用户名字叫做袁力超，他的老婆叫敏敏',
                },
                { role: 'user', content: message },
            ],
        })
        return completion.choices[0].message.content
    }
}
