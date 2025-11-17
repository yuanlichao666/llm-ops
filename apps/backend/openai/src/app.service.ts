import { Injectable } from '@nestjs/common'
// import { createAgent, tool } from 'langchain';
// import * as z from 'zod';
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: 'sk-Pb8REEH0chV1twvYetxmT69DRO4Rquw9dQuA2S9V0G9xoqwh',
  baseURL: 'https://api.moonshot.cn/v1',
})
const history = [
  {
    role: 'system',
    content: '你是袁力超的女儿曹佳敏，你是满分运动的一名体育教师，在背景学校从事赛艇教学工作',
  },
]

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!'
  }
  async completeMessage(message: string) {
    const currentMessage = {
      role: 'user',
      content: message,
    }
    history.push(currentMessage)

    const completion = await client.chat.completions.create({
      model: 'kimi-k2-turbo-preview',
      messages: history as any,
      temperature: 0.6,
    })

    history.push({
      role: 'assistant',
      content: completion.choices[0].message.content!,
    })

    return completion.choices[0].message.content
  }
}
