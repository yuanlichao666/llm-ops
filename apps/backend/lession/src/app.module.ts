import { Module } from '@nestjs/common'

import { CompletionModule } from './1.2.sdk_completion/sdk-completion.module'
import { ChatCompletionModule } from './1.3.sdk_chat_completion/chat-completion.module'
import { ResponseModule } from './1.4.sdk_response/sdk-response.module'
import { StreamModule } from './1.5.sdk_stream/stream.module'
import { SdkMemoryModule } from './1.6.sdk-momory/sdk-memory.module'
import { LangchainBasicModule } from './2.1.langchain_basic/langchain-basic.module'
import { LangchainMemoryModule } from './2.2.langchain-memory/langchain-memory.module'

@Module({
  imports: [
    CompletionModule,
    ChatCompletionModule,
    ResponseModule,
    StreamModule,
    SdkMemoryModule,
    LangchainBasicModule,
    LangchainMemoryModule,
  ],
})
export class AppModule {}
