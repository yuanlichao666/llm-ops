import { Body, Controller, Get, Post } from '@nestjs/common'
import { AIMessageChunk } from 'langchain'

import { CompleteMessageDTO, CompleteMessageWithPromptDTO } from './app.dto'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello()
  }

  @Post('/completeMessage')
  async completeMessage(@Body() completeMessageDTO: CompleteMessageDTO): Promise<AIMessageChunk> {
    const { message } = completeMessageDTO
    return await this.appService.completeMessage(message)
  }

  @Post('/completeMessageWithPrompt')
  async completeMessageWithPrompt(@Body() completeMessageWithPromptDTO: CompleteMessageWithPromptDTO) {
    const { name, course, message } = completeMessageWithPromptDTO
    return await this.appService.completeMessageWithPrompt(name, course, message)
  }
}
