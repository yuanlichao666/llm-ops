import { Controller, Get, Query } from '@nestjs/common'

import { RetrieverService } from './retriever.service'

@Controller('langchain/rag/retriever')
export class RetrieverController {
    constructor(private readonly retrieverService: RetrieverService) {}

    @Get('/queryWithDefaultConfig')
    queryWithDefaultConfig(@Query('message') message: string) {
        return this.retrieverService.queryWithDefaultConfig(message)
    }

    @Get('queryWithCustomRetriever')
    queryWithCustomRetriever(@Query('message') message: string) {
        return this.retrieverService.queryWithCustomRetriever(message)
    }

    @Get('/firstAgent')
    firstAgent(@Query('message') message: string) {
        return this.retrieverService.firstAgent(message)
    }

    @Get('/multiQueryRetriever')
    multiQueryRetriever(@Query('message') message: string) {
        return this.retrieverService.multiQueryRetriever(message)
    }
}
