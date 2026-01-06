import { Controller, Get, Query } from '@nestjs/common'

import { LangchainToolsService } from './langchain-tools.service'

@Controller('langchain/agent')
export class LangchainToolsController {
    constructor(
        private readonly langchainToolsService: LangchainToolsService
    ) {}

    @Get('/duckduckgoSearch')
    async duckduckgoSearch(@Query('message') message: string) {
        return this.langchainToolsService.useduckduckgoSearch(message)
    }

    @Get('/serp')
    async serp(@Query('message') message: string) {
        return this.langchainToolsService.useSerp(message)
    }

    @Get('/serpApi')
    async serpApi(@Query('message') message: string) {
        return this.langchainToolsService.useSerpApi(message)
    }

    @Get('/customToolBySchema')
    async customToolBySchema(@Query('message') message: string) {
        return this.langchainToolsService.customToolBySchema(message)
    }

    @Get('/customToolByClass')
    async customToolByClass(@Query('message') message: string) {
        return this.langchainToolsService.customToolByClass(message)
    }

    @Get('/useGaoDeWeather')
    async useGaoDeWeather(@Query('message') message: string) {
        return this.langchainToolsService.useGaoDeWeather(message)
    }

    @Get('/bindTools')
    async bindTools(@Query('message') message: string) {
        return this.langchainToolsService.bindTools(message)
    }

    @Get('/renderTextToolInfo')
    async renderTextToolInfo() {
        return this.langchainToolsService.renderTextToolInfo()
    }

    @Get('/errorRetryStrategy')
    async errorRetryStrategy(@Query('message') message: string) {
        return this.langchainToolsService.errorRetryStrategy(message)
    }

    @Get('/multiModalInput')
    async multiModalInput(@Query() query: { message: string; image: string }) {
        return this.langchainToolsService.multiModalInput(
            query.message,
            query.image
        )
    }
}
