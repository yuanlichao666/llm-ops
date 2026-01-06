import { Controller, Get, Query } from '@nestjs/common'

import { EmbeddingsService } from './embedding.service'

@Controller('langchain/rag/embedding')
export class EmbeddingsController {
    constructor(private readonly embeddingsService: EmbeddingsService) {}

    @Get('/embeddingUsage')
    embeddingUsage(@Query('message') message: string) {
        return this.embeddingsService.embeddingUsage(message)
    }

    @Get('/embeddingWithCacheUsage')
    embeddingWithCacheUsage(@Query('message') message: string) {
        return this.embeddingsService.embeddingWithCacheUsage(message)
    }
}
