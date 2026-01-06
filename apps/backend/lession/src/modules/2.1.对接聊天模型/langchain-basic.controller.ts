import { Controller, Get, Query, Sse } from '@nestjs/common'
import { from, map } from 'rxjs'

import {
    PrebuiltTemplateDto,
    RunnableBranchDto,
    UserDto,
} from './langchain-basic.dto'
import { LangchainBasicService } from './langchain-basic.service'

function display(chunk: any) {
    return {
        data: chunk,
    }
}

@Controller('langchain/rag/basic')
export class LangchainBasicController {
    constructor(
        private readonly langchainBasicService: LangchainBasicService
    ) {}

    @Get('/invoke')
    async chatWithModel(@Query('message') message: string) {
        return this.langchainBasicService.invoke(message)
    }

    @Sse('/stream')
    async chatWithModelStream(@Query('message') message: string) {
        const stream = await this.langchainBasicService.stream(message)
        return from(stream).pipe(map(display))
    }

    @Sse('/message')
    async useMessageComponent(@Query('message') message: string) {
        const stream = await this.langchainBasicService.message(message)
        return from(stream).pipe(map(display))
    }

    @Sse('/promptTemplate')
    async usePromptTemplate(@Query('message') message: string) {
        const stream = await this.langchainBasicService.promptTemplate(message)
        return from(stream).pipe(map(display))
    }

    @Sse('/runnableSequence')
    async useSequentialChain(@Query('message') message: string) {
        const stream =
            await this.langchainBasicService.runnableSequence(message)
        return from(stream).pipe(map(display))
    }

    @Sse('/pipe')
    async usePipe(@Query('message') message: string) {
        const stream = await this.langchainBasicService.pipe(message)
        return from(stream).pipe(map(display))
    }

    @Sse('/runnableParallel')
    async useParallelChain(@Query() user: UserDto) {
        const stream = await this.langchainBasicService.runnableParallel(user)
        return from(stream).pipe(map(display))
    }

    @Sse('/runnableMap')
    async useMapChain(@Query() user: UserDto) {
        const stream = await this.langchainBasicService.runnableMap(user)
        return from(stream).pipe(map(display))
    }

    @Get('/dynamicConfig')
    async dynamicConfig(@Query('message') message: string) {
        const stream = await this.langchainBasicService.dynamicConfig(message)
        return from(stream).pipe(map(display))
    }

    @Get('/prebuiltModel')
    async withModelConfig(@Query('message') message: string) {
        const stream = await this.langchainBasicService.prebuiltModel(message)
        return from(stream).pipe(map(display))
    }

    @Sse('/prebuiltLambda')
    async withCustomConfig(@Query() user: UserDto) {
        const stream = await this.langchainBasicService.prebuiltLambda(user)
        return from(stream).pipe(map(display))
    }

    @Get('/prebuiltTemplate')
    async prebuiltTemplate(@Query() dto: PrebuiltTemplateDto) {
        const stream = await this.langchainBasicService.prebuiltTemplate(
            dto.message,
            dto.role
        )
        return from(stream).pipe(map(display))
    }

    @Sse('/dyncmicComponentByRunnableBranch')
    async dyncmicComponentByRunnableBranch(
        @Query() userInput: RunnableBranchDto
    ) {
        const stream =
            await this.langchainBasicService.dyncmicComponentByRunnableBranch(
                userInput
            )
        return from(stream).pipe(map(display))
    }

    @Sse('/dyncmicComponentByRunnableLambda')
    async dyncmicComponentByRunnableLambda(
        @Query() userInput: RunnableBranchDto
    ) {
        const stream =
            await this.langchainBasicService.dyncmicComponentByRunnableLambda(
                userInput
            )
        return from(stream).pipe(map(display))
    }

    @Get('/withRetry')
    async withRetry(@Query('message') message: string) {
        return await this.langchainBasicService.withRetry(message)
    }

    @Sse('/runnableBinding')
    async runnableBinding(@Query('message') message: string) {
        const stream = await this.langchainBasicService.runnableBinding(message)
        return from(stream).pipe(map(display))
    }
}
