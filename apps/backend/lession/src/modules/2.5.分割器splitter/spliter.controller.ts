import {
    Body,
    Controller,
    Get,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import {
    SemanticTextSplitterDto,
    SplitWithUserSeparatorDto,
} from './spliter.dto'
import { SplitterService } from './spliter.service'

@Controller('langchain/rag/splitter')
export class SplitterController {
    constructor(private readonly splitterService: SplitterService) {}
    @Get('/textLoaderUsage')
    async textLoaderUsage() {
        return await this.splitterService.textLoaderUsage()
    }
    @Get('/customDocumentLoaderUsage')
    async customDocumentLoaderUsage() {
        return await this.splitterService.customDocumentLoaderUsage()
    }

    @Get('/characterTextSplitterUsage')
    async characterTextSplitterUsage() {
        return await this.splitterService.characterTextSplitterUsage()
    }

    @Get('/recursiveCharacterTextSplitterUsage')
    async recursiveCharacterTextSplitterUsage() {
        return await this.splitterService.recursiveCharacterTextSplitterUsage()
    }

    @Get('/splitCode')
    async splitCode() {
        return await this.splitterService.splitCode()
    }

    @Get('/customSeparator')
    async customSeparator() {
        return await this.splitterService.customSeparator()
    }

    @Post('/splitWithUserSeparator')
    async splitWithUserSeparator(@Body() body: SplitWithUserSeparatorDto) {
        return await this.splitterService.splitWithUserSeparator(
            body.separators,
            body.chunkSize,
            body.chunkOverlap
        )
    }

    @Get('/semanticTextSplitterUsage')
    async semanticTextSplitterUsage() {
        return await this.splitterService.semanticTextSplitterUsage()
    }

    @Post('/embddingFileWithSemanticTextSplitter')
    @UseInterceptors(FileInterceptor('file'))
    async embddingWithSemanticTextSplitter(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: SemanticTextSplitterDto
    ) {
        return await this.splitterService.embddingWithSemanticTextSplitter(
            file.buffer.toString('utf-8'),
            { ...body }
        )
    }
}
