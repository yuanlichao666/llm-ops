import {
    Controller,
    FileTypeValidator,
    Get,
    ParseFilePipe,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import { OptimisticService } from './optimistic.service'

@Controller('langchain/rag/optimistic')
export class OptimisticController {
    constructor(private readonly optimisticService: OptimisticService) {}

    @Get('/queryFusionRetriever')
    queryFusionRetriever(@Query('message') query: string) {
        return this.optimisticService.queryFusionRetriever(query)
    }

    @Get('/querySerialSubQuestions')
    querySerialSubQuestions(@Query('message') query: string) {
        return this.optimisticService.querySerialSubQuestions(query)
    }

    @Get('/queryParallelSubQuestions')
    queryParallelSubQuestions(@Query('message') query: string) {
        return this.optimisticService.queryParallelSubQuestions(query)
    }

    @Get('/queryStepBackRetriever')
    queryStepBackRetriever(@Query('message') query: string) {
        return this.optimisticService.queryStepBackRetriever(query)
    }

    @Get('/queryHybridRetriever')
    queryHybridRetriever(@Query('message') query: string) {
        return this.optimisticService.queryHybridRetriever(query)
    }

    @Get('/queryEnsembleRetriever')
    queryEnsembleRetriever(@Query('message') query: string) {
        return this.optimisticService.queryEnsembleRetriever(query)
    }

    @Get('/queryRetrieverRouter')
    queryRetrieverRouter(@Query('message') query: string) {
        return this.optimisticService.queryRetrieverRouter(query)
    }

    @Get('/queryPromotRouter')
    queryPromotRouter(@Query('message') query: string) {
        return this.optimisticService.queryPromotRouter(query)
    }

    @Get('/querySelfQueryRetriever')
    querySelfQueryRetriever(@Query('message') query: string) {
        return this.optimisticService.querySelfQueryRetriever(query)
    }

    @Post('/addMultiVectorDocs')
    @UseInterceptors(FileInterceptor('file'))
    addMultiVectorDocs(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new FileTypeValidator({
                        fileType: /text\/.*$/,
                        skipMagicNumbersValidation: true,
                    }),
                ],
            })
        )
        file: Express.Multer.File
    ) {
        return this.optimisticService.addMultiVectorDocs(
            file.buffer.toString('utf-8')
        )
    }

    @Get('/queryMultiVectorRetriever')
    queryMultiVectorRetriever(@Query('message') query: string) {
        return this.optimisticService.queryMultiVectorRetriever(query)
    }

    @Post('/addDocsUseParentDocumentRetriever')
    @UseInterceptors(FileInterceptor('file'))
    addDocsUseParentDocumentRetriever(
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.optimisticService.addDocsUseParentDocumentRetriever(
            new Blob([new Uint8Array(file.buffer)], { type: file.mimetype })
        )
    }

    @Get('/queryParentDocumentRetriever')
    queryParentDocumentRetriever(@Query('message') query: string) {
        return this.optimisticService.queryParentDocumentRetriever(query)
    }

    @Get('/queryRerankCompressRetriever')
    queryRerankCompressRetriever(@Query('message') query: string) {
        return this.optimisticService.queryRerankCompressRetriever(query)
    }
}
