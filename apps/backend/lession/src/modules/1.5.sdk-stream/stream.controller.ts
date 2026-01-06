import { Body, Controller, Logger, Post, Query, Res, Sse } from '@nestjs/common'
import { Response } from 'express'
import { ChatCompletionChunk } from 'openai/resources/chat/completions'
import { map } from 'rxjs'
import { Readable } from 'stream'

import { AsyncIteratorToObservable } from '../../helpers/stream'
import { StreamDto } from './stream.dto'
import { StreamService } from './stream.service'

@Controller()
export class StreamController {
    private readonly logger = new Logger(StreamController.name)

    constructor(private readonly streamService: StreamService) {}

    // 写法1 监听事件返回
    @Post('/sdk/stream1')
    async stream(@Body() body: StreamDto, @Res() res: Response) {
        // 设置 SSE 响应头
        res.status(200)
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Connection', 'keep-alive')

        try {
            const { message } = body

            // openai 流返回的是 AsyncIterator<ChatCompletionChunk>
            // 同时它也可以转换为 ReadableStream（web），或转为Stream（node）
            const asyncIterator = await this.streamService.stream(message)
            const stream = Readable.from(asyncIterator)

            // 开始通过sse推流
            stream.on('data', (chunk: ChatCompletionChunk) => {
                const content = chunk.choices[0]?.delta?.content ?? ''
                res.write(`data: ${content}\n\n`)
            })

            stream.on('end', () => {
                res.write('data: [DONE]\n\n')
                res.end()
            })

            stream.on('error', error => {
                this.logger.error('Stream error:', error)
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Stream error occurred' })
                } else {
                    res.end()
                }
            })
        } catch (error) {
            this.logger.error('Stream controller error:', error)
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to create stream' })
            }
        }
    }

    // 写法2 使用es9的 for await...of 循环（异步迭代器语法）
    @Post('/sdk/stream2')
    async stream2(@Body() body: StreamDto, @Res() res: Response) {
        //同样的需要设置响应头
        res.status(200)
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Connection', 'keep-alive')

        try {
            const { message } = body
            const stream = await this.streamService.stream(message)

            //开始推流，这里我们直接for await...of循环，就不转nodestream监听事件了
            //使用循环后语法简介多了，迭代完成意味着流也结束了
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content ?? ''
                res.write(`data: ${content}\n\n`)
            }
            res.write('data: [DONE]\n\n')
            res.end()
        } catch (error) {
            this.logger.error('Stream controller error:', error)
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to create stream' })
            }
        }
    }

    //写法3 使用nestjs的@Sse装饰器
    @Sse('/sdk/stream3')
    async stream3(@Query('message') message: string) {
        const stream = await this.streamService.stream(message)
        return AsyncIteratorToObservable<ChatCompletionChunk>(stream).pipe(
            map(chunk => chunk.choices[0]?.delta?.content ?? '')
        )
    }
}
