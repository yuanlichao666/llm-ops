import { Inject, Injectable } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class ResponseService {
  constructor(@Inject('OpenAI') private readonly openai: OpenAI) {}

  // chat response api , 新标准，只有部分模型支持
  // https://github.com/openai/openai-node#readme
  // 月之暗面返回404，因为他还没实现

  async createResponse(message: string) {
    const completion = await this.openai.responses.create({
      model: 'kimi-k2-turbo-preview',
      input: message,
      instructions: '你是一个助手，请回答用户的问题,用户名字叫做袁力超，他的老婆叫敏敏',
    })
    return completion.output_text
  }
}
