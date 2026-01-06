import { Body, Controller, Post } from '@nestjs/common'

import { CompletionDto } from './sdk-completion.dto'
import { CompletionService } from './sdk-completion.service'

@Controller()
export class CompletionController {
    constructor(private readonly completionService: CompletionService) {}

    @Post('/sdk/complete')
    async complete(@Body() body: CompletionDto) {
        return this.completionService.complete(body.message)
    }
}
