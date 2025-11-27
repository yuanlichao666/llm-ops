import { Controller, Query, Sse } from '@nestjs/common'
import { ChatCompletionChunk } from 'openai/resources/index.mjs'
import { map } from 'rxjs'

import { SdkMemoryService } from './sdk-memory.service'

@Controller()
export class SdkMemoryController {
  constructor(private readonly sdkMemoryService: SdkMemoryService) {}

  @Sse('/sdk/completeChatWithMemory')
  async completeChatWithMemory(@Query('message') message: string) {
    return (await this.sdkMemoryService.completeChatWithMemory(message)).pipe(
      map((chunk: ChatCompletionChunk) => ({
        data: chunk.choices[0]?.delta?.content ?? '',
      }))
    )
  }
}
