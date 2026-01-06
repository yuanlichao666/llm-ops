import { Inject, Injectable } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class StreamService {
    constructor(@Inject('OpenAI') private readonly openai: OpenAI) {}

    async stream(message: string) {
        return await this.openai.chat.completions.create({
            model: 'kimi-k2-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一个助手，请回答用户的问题,用户名字叫做袁力超，他的老婆叫敏敏',
                },
                { role: 'user', content: message },
            ],
            stream: true, // 流式返回
        })
        // // 这里使用 Readable.fromWeb 将 OpenAI 的 ReadableStream 转换为 Node.js Stream
        // // 返回 ReadableStream，在 controller 中使用 @Res() 处理
        // return Readable.fromWeb(stream.toReadableStream() as ReadableStream)
    }
}
