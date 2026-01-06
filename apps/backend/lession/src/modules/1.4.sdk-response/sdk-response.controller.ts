import { Body, Controller, Post } from '@nestjs/common'

import { CreateResponseDto } from './create-response.dto'
import { ResponseService } from './sdk-response.service'

@Controller()
export class ResponseController {
    constructor(private readonly responseService: ResponseService) {}

    @Post('/sdk/createResponse')
    async createResponse(@Body() body: CreateResponseDto) {
        const { message } = body
        return this.responseService.createResponse(message)
    }
}
