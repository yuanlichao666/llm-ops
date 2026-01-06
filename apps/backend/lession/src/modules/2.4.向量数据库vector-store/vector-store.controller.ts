import { Body, Controller, Get, Post, Query } from '@nestjs/common'

import { AddDocumentsDto } from './vector-store.dto'
import { VectorStoreService } from './vector-store.service'

@Controller('langchain/rag/vector-store')
export class VectorStoreController {
    constructor(private readonly vectorStoreService: VectorStoreService) {}
    @Post('/addDocumentsUseFaissStore')
    addDocumentsUseFaissStore(@Body() body: AddDocumentsDto) {
        return this.vectorStoreService.addDocumentsUseFaissStore(body.docs)
    }

    @Get('/queryUseFaissStore')
    queryUseFaissStore(@Query('message') message: string) {
        return this.vectorStoreService.queryUseFaissStore(message)
    }

    @Post('/addDocumentsUseWeaviateStore')
    addDocumentsUseWeaviateStore(@Body() body: AddDocumentsDto) {
        return this.vectorStoreService.addDocumentsUseWeaviateStore(body.docs)
    }

    @Get('/queryUseWeaviateStore')
    queryUseWeaviateStore(
        @Query('message') message: string,
        @Query('k') k?: number
    ) {
        return this.vectorStoreService.queryUseWeaviateStore(message, k)
    }

    @Post('/addDocumentsUseCustomStore')
    addDocumentsUseCustomStore(@Body() body: AddDocumentsDto) {
        return this.vectorStoreService.addDocumentsUseCustomStore(body.docs)
    }

    @Get('/queryUseCustomStore')
    queryUseCustomStore(@Query('message') message: string) {
        return this.vectorStoreService.queryUseCustomStore(message)
    }

    @Get('/queryWithThreshold')
    queryWithThreshold(@Query('message') message: string) {
        return this.vectorStoreService.queryWithThreshold(message)
    }

    @Get('/maxMarginalRelevanceSearch')
    maxMarginalRelevanceSearch(@Query('message') message: string) {
        return this.vectorStoreService.maxMarginalRelevanceSearch(message)
    }
}
