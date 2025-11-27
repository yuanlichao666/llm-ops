import { Controller, Query, Sse } from '@nestjs/common'
import { from, map } from 'rxjs'

import { LangchainMemoryService } from './langchain-memory.service'

@Controller()
export class LangchainMemoryController {
  constructor(
    private readonly langchainMemoryService: LangchainMemoryService
  ) {}

  @Sse('/langchain/runnableWithMemory')
  async runnableWithMemory(
    @Query('message') message: string,
    @Query('session_id') sessionId: string
  ) {
    const stream = await this.langchainMemoryService.runnableWithMemory(
      message,
      sessionId
    )
    return from(stream).pipe(map(display))
  }
  @Sse('/langchain/runnableWithCustomMemory')
  async runnableWithCustomMemory(
    @Query('message') message: string,
    @Query('session_id') sessionId: string
  ) {
    const stream = await this.langchainMemoryService.runnableWithCustomMemory(
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
