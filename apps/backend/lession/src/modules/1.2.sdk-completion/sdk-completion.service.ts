import { Inject, Injectable } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class CompletionService {
    constructor(@Inject('OpenAI') private readonly openai: OpenAI) {}

    // 对话完成api 已成为遗产api，只有部分保留的模型还在支持，
    // https://platform.openai.com/docs/api-reference/completions/create
    async complete(message: string) {
        const completion = await this.openai.completions.create({
            model: 'kimi-k2-turbo-preview',
            prompt: [
                'system:你是一个助手，请回答用户的问题,用户名字叫做袁力超，他的老婆叫敏敏',
                'user: ' + message,
            ],
        })
        return completion.choices[0].text
    }
}
