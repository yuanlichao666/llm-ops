import { DocumentInterface } from '@langchain/core/documents'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import {
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
} from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { BaseRetriever } from '@langchain/core/retrievers'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'

export class StepBackRetriever extends BaseRetriever {
    lc_namespace: string[] = ['StepBackRetriever']

    constructor(
        private readonly llm: BaseChatModel,
        private readonly retriever: VectorStoreRetriever
    ) {
        super()
    }

    private readonly prompt = `
        你是一个"退一步思考（Step-back Reasoning）"助手。

        你的任务不是直接回答用户问题，而是：
        1. 抽象化用户的问题，使其更通用、更概括；
        2. 去掉无关细节，提炼问题的核心意图；
        3. 生成一个适合做知识库检索的查询（更高层级、更泛化的表达）；
        4. 输出的内容必须清晰、简短、语义更泛化，但与原问题强相关。

        要求：
        - 不要给最终答案。
        - 不要解释过程。
        - 输出必须是**一个可用于检索的优化查询语句**。
        - 尽量覆盖用户问题潜在的上位概念，而不是保持字面一致。

        下面是一些示例：`

    private readonly examples = [
        {
            question: 'iPhone 13 的屏幕分辨率是多少？',
            answer: "将产品型号具体问题抽象为产品规格查询：'iPhone 系列屏幕参数'",
        },
        {
            question: '如何让 NestJS 的依赖注入更灵活？',
            answer: "退一步，将问题从 DI 细节抽象成架构设计类查询：'NestJS 依赖注入与模块化的最佳实践'",
        },
        {
            question: '为什么我的 MySQL 查询变慢了？',
            answer: "将具体报错类问题抽象成性能主题：'MySQL 性能优化常见原因'",
        },
    ]

    private buildMessages(query: string) {
        const messages: BaseMessage[] = [new SystemMessage(this.prompt)]

        // 添加 few-shot 示例
        for (const example of this.examples) {
            messages.push(new HumanMessage(example.question))
            messages.push(new AIMessage(example.answer))
        }

        // 添加用户的实际问题
        messages.push(new HumanMessage(query))

        return messages
    }

    async _getRelevantDocuments(
        _query: string
    ): Promise<DocumentInterface<Record<string, unknown>>[]> {
        const messages = this.buildMessages(_query)

        const stepBackQuery = await this.llm
            .pipe(new StringOutputParser())
            .invoke(messages)

        return await this.retriever.invoke(stepBackQuery)
    }
}
