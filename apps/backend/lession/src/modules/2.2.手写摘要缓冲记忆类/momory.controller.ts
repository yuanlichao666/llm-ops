import { Controller, Query, Sse } from '@nestjs/common'
import { from, map } from 'rxjs'

import { LangchainMemoryService } from './memory.service'

@Controller('langchain/rag/memory')
export class LangchainMemoryController {
    constructor(
        private readonly langchainMemoryService: LangchainMemoryService
    ) {}

    @Sse('/runnableWithBasicMemory')
    async runnableWithMemory(
        @Query('message') message: string,
        @Query('session_id') sessionId: string
    ) {
        const stream =
            await this.langchainMemoryService.runnableWithBasicMemory(
                message,
                sessionId
            )
        return from(stream).pipe(map(display))
    }

    @Sse('/runnableWithCustomMemory')
    async runnableWithCustomMemory(
        @Query('message') message: string,
        @Query('session_id') sessionId: string
    ) {
        const stream =
            await this.langchainMemoryService.runnableWithCustomMemory(
                message,
                sessionId
            )
        return from(stream).pipe(map(display))
    }
}

function display(chunk: any) {
    return {
        data: chunk,
    }
}
