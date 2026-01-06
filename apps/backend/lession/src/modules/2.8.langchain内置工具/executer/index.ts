import { StructuredToolInterface } from '@langchain/core/tools'
import { AIMessage, BaseMessage, ToolCall, ToolMessage } from 'langchain'
import lodash from 'lodash'

export function createToolExecuter(tools: StructuredToolInterface[]) {
    if (!tools || tools.length === 0) {
        throw new Error('Tools are required')
    }

    const toolByName = Object.fromEntries(tools.map(tool => [tool.name, tool]))

    async function toolsExecuter(aiMessage: AIMessage) {
        const noToolCall = !lodash.get(aiMessage, 'tool_calls.length')
        if (noToolCall) {
            throw new Error('No tool calls found in message')
        }

        const toolCalls = aiMessage.tool_calls!
        return await Promise.all(toolCalls.map(toolExecuter))
    }

    async function toolExecuter(toolCall: ToolCall) {
        const { name, args } = toolCall
        const noTool = !toolByName[name]
        if (noTool) {
            throw new Error(`Tool ${name} not found`)
        }

        const tool = toolByName[name]
        const res = await tool.invoke(args)

        return {
            ...toolCall,
            result: res,
        }
    }

    return toolsExecuter
}

export function mapToMessages(callAndResult: ToolCall & { result: any }) {
    const { id, name, result } = callAndResult
    return new ToolMessage(result, id, name)
}

export function isToolCall(message: BaseMessage) {
    return Boolean(lodash.get(message, 'tool_calls.length'))
}
