import { Body, Controller, Get, Post } from '@nestjs/common'

import { CompleteMessageDto } from './app.dto'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello()
  }

  @Post('/completeMessage')
  async completeMessage(@Body() completeMessageDto: CompleteMessageDto) {
    const { message } = completeMessageDto
    return await this.appService.completeMessage(message)
  }
}
