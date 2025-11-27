import { Body, Controller, Post } from '@nestjs/common'

import { ChatCompletionDto } from './sdk-chat-completion.dto'
import { ChatCompletionService } from './sdk-chat-completion.service'

@Controller()
export class ChatCompletionController {
  constructor(private readonly chatCompletionService: ChatCompletionService) {}

  @Post('/sdk/chatComplete')
  async chatComplete(@Body() body: ChatCompletionDto) {
    const { message } = body
    return this.chatCompletionService.chatComplete(message)
  }
}
