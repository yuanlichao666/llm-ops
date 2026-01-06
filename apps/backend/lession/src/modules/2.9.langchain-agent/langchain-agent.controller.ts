import { Controller, Get, Query } from '@nestjs/common'

import { LangchainAgentService } from './langchain-agent.service'

@Controller('langchain/agent')
export class LangchainAgentController {
    constructor(
        private readonly langchainAgentService: LangchainAgentService
    ) {}

    @Get('/agentByReact')
    async agentByReact(@Query('message') message: string) {
        return this.langchainAgentService.agentByReact(message)
    }

    @Get('/agentByToolCalling')
    async agentByToolCalling(@Query('message') message: string) {
        return this.langchainAgentService.agentByToolCalling(message)
    }

    @Get('/agentByLangGraph')
    async agentByLangGraph(@Query('message') message: string) {
        return this.langchainAgentService.agentByLangGraph(message)
    }

    @Get('/langGraphWithTools')
    async langGraphWithTools(@Query('message') message: string) {
        return this.langchainAgentService.langGraphWithTools(message)
    }

    @Get('/langGraphWithCheckpoint')
    async langGraphWithCheckpoint(
        @Query('message') message: string,
        @Query('thread_id') thread_id: string
    ) {
        return this.langchainAgentService.langGraphWithCheckpoint(
            message,
            thread_id
        )
    }

    @Get('/graphWithInterrupt')
    async graphWithInterrupt(@Query('thread_id') thread_id: string) {
        return this.langchainAgentService.graphWithInterrupt(thread_id)
    }

    @Get('/updateGraphState')
    async updateGraphState(@Query('thread_id') thread_id: string) {
        return this.langchainAgentService.updateGraphState(thread_id)
    }

    @Get('/customGraphState')
    async customGraphState(
        @Query('thread_id') thread_id: string,
        @Query('message') message: string
    ) {
        return this.langchainAgentService.customGraphState(thread_id, message)
    }

    @Get('/standaloneMultiAgent')
    async standaloneMultiAgent(
        @Query('thread_id') thread_id: string,
        @Query('message') message: string
    ) {
        return this.langchainAgentService.standaloneMultiAgent(
            thread_id,
            message
        )
    }

    @Get('/sharedStateMultiAgent')
    async sharedStateMultiAgent(
        @Query('thread_id') thread_id: string,
        @Query('message') message: string
    ) {
        return this.langchainAgentService.sharedStateMultiAgent(
            thread_id,
            message
        )
    }

    @Get('/CRAGAgent')
    async CRAGAgent(
        @Query('thread_id') thread_id: string,
        @Query('message') message: string
    ) {
        return this.langchainAgentService.CRAGAgent(thread_id, message)
    }
}
