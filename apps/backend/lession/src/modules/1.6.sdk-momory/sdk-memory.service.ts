import { Inject, Injectable } from '@nestjs/common'
import OpenAI from 'openai'
import { from, reduce, retry, scan, tap } from 'rxjs'

import { branch } from '../../helpers/rxjs'
import { SdkMemory } from './sdk-memory.memory'

@Injectable()
export class SdkMemoryService {
    constructor(
        @Inject('OpenAI') private readonly openai: OpenAI,
        @Inject('Memory') private readonly memory: SdkMemory
    ) {}

    // chat response api , 新标准，只有部分模型支持
    // https://github.com/openai/openai-node#readme
    // 月之暗面返回404，因为他还没实现

    async completeChatWithMemory(message: string) {
        const { memory } = this

        const context = memory.displayContext()

        return from(
            await this.openai.chat.completions.create({
                model: 'kimi-k2-turbo-preview',
                messages: [...context, { role: 'user', content: message }],
                stream: true,
            })
        ).pipe(
            branch(shared$ => [
                // 日志分流
                shared$.pipe(
                    scan((acc, chunk) => {
                        acc += chunk.choices[0]?.delta?.content ?? ''
                        return acc
                    }, ''),
                    tap(log => {
                        // eslint-disable-next-line no-console
                        console.log('stream log chunk', log)
                    })
                ),
                // 保存分流
                shared$.pipe(
                    reduce((acc, chunk) => {
                        acc += chunk.choices[0]?.delta?.content ?? ''
                        return acc
                    }, ''),
                    tap(fullResponse => {
                        memory.saveMessage([
                            { role: 'user', content: message },
                            { role: 'assistant', content: fullResponse },
                        ])
                    })
                ),
            ]),
            tap(chunk => {
                // eslint-disable-next-line no-console
                console.log(
                    'main chunk',
                    chunk.choices[0]?.delta?.content ?? ''
                )
            }),
            retry(3)
        )
    }
}
