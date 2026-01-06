import {
    AgentExecutor,
    createReactAgent,
    createToolCallingAgent,
} from '@langchain/classic/agents'
import { MultiVectorRetriever } from '@langchain/classic/retrievers/multi_vector'
import { LocalFileStore } from '@langchain/classic/storage/file_system'
import { SerpAPI } from '@langchain/community/tools/serpapi'
import { Document } from '@langchain/core/documents'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { VectorStore } from '@langchain/core/vectorstores'
import {
    Annotation,
    END,
    MemorySaver,
    MessagesAnnotation,
    START,
    StateGraph,
} from '@langchain/langgraph'
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt'
import { Inject, Injectable } from '@nestjs/common'
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from 'langchain'
import * as hub from 'langchain/hub/node'
import z from 'zod'

import { concatTemplate } from '../../helpers/concatTemplate'
import {
    createToolExecuter,
    isToolCall,
    mapToMessages,
} from '../2.8.langchain内置工具/executer'
import { gaoDeWeather } from '../2.8.langchain内置工具/tools/gaode-weather'
import { FirstValue, LastValue } from './annotations'

@Injectable()
export class LangchainAgentService {
    private checkpointer = new MemorySaver()

    constructor(
        @Inject('SerpApi') private readonly serpApi: SerpAPI,
        @Inject('ChatModel') private readonly chatModel: BaseChatModel,
        @Inject('ByteStore') private readonly byteStore: LocalFileStore,
        @Inject('VectorStore') private readonly vectorStore: VectorStore
    ) {
        this.chatModel = chatModel.withConfig({
            configurable: {
                temperature: 0,
            },
        }) as BaseChatModel
    }

    // 基于react的智能体实现。依靠提示词、固定格式输出提取内容，但实际使用限制比较多，已成为过去式
    async agentByReact(message: string) {
        const { serpApi, chatModel } = this
        const prompt = (await hub.pull('hwchase17/react')) as any

        const agent = await createReactAgent({
            prompt,
            llm: chatModel,
            tools: [serpApi, gaoDeWeather as any],
        })

        return new AgentExecutor({
            agent,
            tools: [serpApi, gaoDeWeather as any],
            handleParsingErrors: (error: Error) => {
                // 如果解析错误，返回错误信息给模型，让它重新生成
                return `解析输出时出错：${error.message}。请确保你的输出格式正确，要么是 Action/Action Input，要么是 Final Answer，不能同时包含两者。请重新生成正确的输出。`
            },
            verbose: true,
            maxIterations: 15, // 限制最大迭代次数，避免无限循环
        }).invoke({ input: message })
    }

    //基于工具调用的智能体实现。通过工具调用，实现更复杂的任务
    async agentByToolCalling(message: string) {
        const { serpApi, chatModel } = this
        const prompt = ChatPromptTemplate.fromMessages([
            ['system', '你是一个助手，请回答用户的问题'],
            ['placeholder', '{chat_history}'],
            ['user', '{input}'],
            ['placeholder', '{agent_scratchpad}'],
        ])

        const agent = await createToolCallingAgent({
            prompt,
            llm: chatModel,
            tools: [serpApi, gaoDeWeather as any],
        })

        const executer = new AgentExecutor({
            agent,
            tools: [serpApi, gaoDeWeather as any],
            verbose: true,
        })

        return executer.invoke({ input: message })
    }

    //基于langgraph的智能体实现。通过langgraph，实现更复杂的任务
    async agentByLangGraph(message: string) {
        const { chatModel } = this

        // 定义 LLM 节点函数
        const callModel = async (state: typeof MessagesAnnotation.State) => {
            const response = await chatModel.invoke(state.messages)
            return { messages: [response] }
        }

        // 使用链式调用确保类型正确推断
        const graph = new StateGraph(MessagesAnnotation)
            .addNode('llm', callModel)
            .addEdge(START, 'llm')
            .addEdge('llm', END)

        const runnable = graph.compile()

        return runnable.invoke({
            messages: [
                new SystemMessage('你是一个助手，请回答用户的问题'),
                new HumanMessage(message),
            ],
        })
    }

    // 基于langgraph和工具绑定的智能体实现
    async langGraphWithTools(message: string) {
        const chatModel = this.chatModel.bindTools!([
            this.serpApi,
            gaoDeWeather,
        ])

        const llmNode = async (state: typeof MessagesAnnotation.State) => {
            const response = await chatModel.invoke(state.messages)
            return { messages: [response] }
        }

        const toolsNode = async (state: typeof MessagesAnnotation.State) => {
            const toolsExecuter = createToolExecuter([
                this.serpApi,
                gaoDeWeather,
            ])
            const aiMessage = state.messages.at(-1)
            const results = await toolsExecuter(aiMessage as AIMessage)
            return { messages: results.map(mapToMessages) }
        }

        const toolCallOrEnd = async (
            state: typeof MessagesAnnotation.State
        ) => {
            const lastMessage = state.messages.at(-1)!
            return isToolCall(lastMessage) ? 'tools' : END
        }

        const graph = new StateGraph(MessagesAnnotation)
            .addNode('llm', llmNode)
            .addNode('tools', toolsNode)
            .addEdge(START, 'llm')
            .addEdge('tools', 'llm')
            .addConditionalEdges('llm', toolCallOrEnd)

        const state = await graph.compile().invoke({
            messages: [
                new SystemMessage('你是一个助手，请回答用户的问题'),
                new HumanMessage(message),
            ],
        })

        return Promise.all(
            state.messages.map(message =>
                new StringOutputParser().invoke(message)
            )
        )
    }

    // 添加检查点实现记忆功能
    async langGraphWithCheckpoint(message: string, thread_id: string) {
        const { chatModel, checkpointer } = this
        const conf = { configurable: { thread_id } }

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ['system', '你是一个助手，请回答用户的问题'],
            ['placeholder', '{messages}'],
        ])

        const callModel = async (state: typeof MessagesAnnotation.State) => {
            const response = await promptTemplate
                .pipe(chatModel)
                .invoke({ messages: state.messages })
            return { messages: [response] }
        }

        const callTool = async (state: typeof MessagesAnnotation.State) => {
            const toolsExecuter = createToolExecuter([
                this.serpApi,
                gaoDeWeather,
            ])
            const aiMessage = state.messages.at(-1)
            const results = await toolsExecuter(aiMessage as AIMessage)
            return { messages: results.map(mapToMessages) }
        }

        const toolCallOrEnd = async (
            state: typeof MessagesAnnotation.State
        ) => {
            const lastMessage = state.messages.at(-1)!
            return isToolCall(lastMessage) ? 'callTool' : END
        }

        const graph = new StateGraph(MessagesAnnotation)
            .addNode('callModel', callModel)
            .addNode('callTool', callTool)
            .addEdge(START, 'callModel')
            .addEdge('callTool', 'callModel')
            .addConditionalEdges('callModel', toolCallOrEnd)
            .compile({ checkpointer })

        return await graph.invoke(
            { messages: [new HumanMessage(message)] },
            conf
        )
    }

    // 带断点的图执行
    async graphWithInterrupt(thread_id: string) {
        const { checkpointer } = this
        const chatModel = this.chatModel.bindTools!([
            this.serpApi,
            gaoDeWeather,
        ])
        const userConfig = { configurable: { thread_id } }

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ['system', '你是一个助手，请回答用户的问题'],
            ['placeholder', '{messages}'],
        ])

        const callModel = async (state: typeof MessagesAnnotation.State) => {
            const response = await promptTemplate
                .pipe(chatModel)
                .invoke({ messages: state.messages })
            return { messages: [response] }
        }

        const callTool = async (state: typeof MessagesAnnotation.State) => {
            await sleep(5000)
            const toolsExecuter = createToolExecuter([
                this.serpApi,
                gaoDeWeather,
            ])
            const aiMessage = state.messages.at(-1)
            const results = await toolsExecuter(aiMessage as AIMessage)
            return { messages: results.map(mapToMessages) }
        }

        const toolCallOrEnd = async (
            state: typeof MessagesAnnotation.State
        ) => {
            const lastMessage = state.messages.at(-1)!
            return isToolCall(lastMessage) ? 'callTool' : END
        }

        const graph = new StateGraph(MessagesAnnotation)
            .addNode('callModel', callModel)
            .addNode('callTool', callTool)
            .addEdge(START, 'callModel')
            .addEdge('callTool', 'callModel')
            .addConditionalEdges('callModel', toolCallOrEnd)
            .compile({ checkpointer, interruptBefore: ['callTool'] })

        // const beforeToolCall = await graph.invoke(
        //     { messages: [new HumanMessage(message)] },
        //     userConfig
        // )
        // console.log(beforeToolCall)

        const fullResult = await graph.invoke(null, userConfig)
        // console.log(fullResult)

        return fullResult
    }

    // 利用断点和检查点实现修改图状态
    async updateGraphState(thread_id: string) {
        const { checkpointer } = this
        const chatModel = this.chatModel.bindTools!([
            this.serpApi,
            gaoDeWeather,
        ])
        const userConfig = { configurable: { thread_id } }

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ['system', '你是一个助手，请回答用户的问题'],
            ['placeholder', '{messages}'],
        ])

        const callModel = async (state: typeof MessagesAnnotation.State) => {
            const response = await promptTemplate
                .pipe(chatModel)
                .invoke({ messages: state.messages })
            return { messages: [response] }
        }

        const callTool = async (state: typeof MessagesAnnotation.State) => {
            await sleep(5000)
            const toolsExecuter = createToolExecuter([
                this.serpApi,
                gaoDeWeather,
            ])
            const aiMessage = state.messages.at(-1)
            const results = await toolsExecuter(aiMessage as AIMessage)
            return { messages: results.map(mapToMessages) }
        }

        const toolCallOrEnd = async (
            state: typeof MessagesAnnotation.State
        ) => {
            const lastMessage = state.messages.at(-1)!
            return isToolCall(lastMessage) ? 'callTool' : END
        }

        const graph = new StateGraph(MessagesAnnotation)
            .addNode('callModel', callModel)
            .addNode('callTool', callTool)
            .addEdge(START, 'callModel')
            .addEdge('callTool', 'callModel')
            .addConditionalEdges('callModel', toolCallOrEnd)
            .compile({ checkpointer, interruptAfter: ['callTool'] })

        // invok返回的是当前图状态的值
        // const value = await graph.invoke(
        //     { messages: [new HumanMessage('北京今天的天气怎么样')] },
        //     userConfig
        // )

        //getState返回的是图状态的快照
        const snapshot = await graph.getState(userConfig)

        // console.log('value', value)
        // console.log('snapshot', snapshot)

        snapshot.values.messages.at(-1).content = '北京今天是大晴天'

        await graph.updateState(userConfig, snapshot.values)

        return graph.invoke(null, userConfig)
    }

    // 自定义状态和更新函数,以及langgraph预构建套件的使用
    async customGraphState(thread_id: string, message: string) {
        /**
         * langgraph中有三种声明state的方式
         * 1.zod 最省事，但不够灵活
         * 2.channels 灵活，不够省事
         * 3.Annotation.Root({})  兼具灵活性与易用性
         */
        const chatModel = this.chatModel.bindTools!([
            this.serpApi,
            gaoDeWeather,
        ])

        const CustomState = Annotation.Root({
            // 简单的值替换
            llmExecCount: Annotation<number>,
            // 传入对象自定义更新逻辑
            messages: Annotation<BaseMessage[]>({
                reducer: (acc, value) => [...acc, ...value],
                default: () => [],
            }),
        })

        const llmNode = async (state: typeof CustomState.State) => {
            return await chatModel.invoke(state.messages).then(message => ({
                llmExecCount: state.llmExecCount + 1,
                messages: [message],
            }))
        }

        const toolNode = (state: typeof CustomState.State) => {
            return new ToolNode([this.serpApi, gaoDeWeather])
                .invoke(state.messages)
                .then(messages => ({
                    messages,
                }))
        }

        const graph = new StateGraph(CustomState)
            .addNode('llm', llmNode)
            .addNode('tools', toolNode)
            .addEdge(START, 'llm')
            .addEdge('tools', 'llm')
            .addConditionalEdges('llm', toolsCondition)
            .compile()

        return await graph.invoke({
            messages: [new HumanMessage(message)],
            llmExecCount: 0,
        })
    }

    // 构建独立多智能体，显示控制子图状态集成到父图
    async standaloneMultiAgent(thread_id: string, message: string) {
        const { chatModel } = this

        // 1.小红书文案智能体
        const XhsState = Annotation.Root({
            ...MessagesAnnotation.spec,
            content: Annotation<string>,
        })

        const xhs_promptTemplate = ChatPromptTemplate.fromMessages([
            ['system', '你是小红书文案专家，请根据用户的产品生成小红书文案'],
            ['placeholder', '{messages}'],
        ])

        const xhs_llmNode = (state: typeof MessagesAnnotation.State) => {
            const { messages } = state
            const llm = chatModel.bindTools!([this.serpApi, gaoDeWeather])
            return xhs_promptTemplate
                .pipe(llm)
                .invoke({ messages })
                .then(aiMessage => ({
                    messages: [aiMessage],
                    content: aiMessage.content,
                }))
        }

        const xhs_toolNode = new ToolNode([this.serpApi, gaoDeWeather])

        const xhs_graph = new StateGraph(XhsState)
            .addNode('llm', xhs_llmNode)
            .addNode('tools', xhs_toolNode)
            .addEdge(START, 'llm')
            .addEdge('tools', 'llm')
            .addConditionalEdges('llm', toolsCondition)
            .compile()

        // 2.抖音文案智能体
        const DouyinState = Annotation.Root({
            ...MessagesAnnotation.spec,
            content: Annotation<string>,
        })

        const douyin_promptTemplate = ChatPromptTemplate.fromMessages([
            ['system', '你是抖音文案专家，请根据用户的产品生成抖音文案'],
            ['placeholder', '{messages}'],
        ])

        const douyin_llmNode = async (
            state: typeof MessagesAnnotation.State
        ) => {
            const { messages } = state
            const llm = chatModel.bindTools!([this.serpApi, gaoDeWeather])

            return douyin_promptTemplate
                .pipe(llm)
                .invoke({ messages })
                .then(aiMessage => ({
                    messages: [aiMessage],
                    content: aiMessage.content,
                }))
        }
        const douyin_toolNode = new ToolNode([this.serpApi, gaoDeWeather])

        const douyin_graph = new StateGraph(DouyinState)
            .addNode('llm', douyin_llmNode)
            .addNode('tools', douyin_toolNode)
            .addEdge(START, 'llm')
            .addEdge('tools', 'llm')
            .addConditionalEdges('llm', toolsCondition)
            .compile()

        // 3.app智能体，在节点函数中将子图作为lcel执行
        const appState = Annotation.Root({
            query: Annotation<string>,
            xhsContent: Annotation<string>,
            douyinContent: Annotation<string>,
        })

        const app_parallelNode = state => state

        const app_xhsNode = (state: typeof appState.State) => {
            const { query } = state
            return xhs_graph
                .invoke({ messages: [new HumanMessage(query)] })
                .then(state => ({
                    xhsContent: state.content,
                }))
        }

        const app_douyinNode = (state: typeof appState.State) => {
            const { query } = state
            return douyin_graph
                .invoke({ messages: [new HumanMessage(query)] })
                .then(state => ({
                    douyinContent: state.content,
                }))
        }

        const app_graph = new StateGraph(appState)
            .addNode('parallel', app_parallelNode)
            .addNode('xhs', app_xhsNode)
            .addNode('douyin', app_douyinNode)
            .addEdge(START, 'parallel')
            .addEdge('parallel', 'xhs')
            .addEdge('parallel', 'douyin')
            .compile()

        return await app_graph.invoke({ query: message })
    }

    // 构建共享状态智能体，隐式将子图状态更新到父图
    sharedStateMultiAgent(thread_id: string, message: string) {
        /**
         * 状态共享的基本规则是
         * 父亲的状态会传入到孩子的状态中进行合并，
         * 子状态返回的时候，公共属性字段即使没修改也会触发父亲中该字段的更新
         * 而默认的Annotation采用LastValueReducer，该reducer只允许在同一级step中更新一次，
         */
        const XhsState = Annotation.Root({
            ...MessagesAnnotation.spec,
            query: FirstValue<string>,
            xhsContent: Annotation<string>,
        })

        const xhs_promptTemplate = ChatPromptTemplate.fromMessages([
            ['system', '你是小红书文案专家，请根据用户的产品生成小红书文案'],
            ['placeholder', '{query}'],
            ['placeholder', '{messages}'],
        ])

        const xhs_llmNode = (state: typeof XhsState.State) => {
            const { messages, query } = state
            const { chatModel } = this

            const llm = chatModel.bindTools!([this.serpApi, gaoDeWeather])

            return xhs_promptTemplate
                .pipe(llm)
                .invoke({ messages, query })
                .then(aiMessage => ({
                    messages: [aiMessage],
                    xhsContent: aiMessage.content,
                }))
        }

        const xhs_toolNode = new ToolNode([this.serpApi, gaoDeWeather])

        const xhs_graph = new StateGraph(XhsState)
            .addNode('llm', xhs_llmNode)
            .addNode('tools', xhs_toolNode)
            .addEdge(START, 'llm')
            .addEdge('tools', 'llm')
            .addConditionalEdges('llm', toolsCondition)
            .compile()

        const DouyinState = Annotation.Root({
            ...MessagesAnnotation.spec,
            query: FirstValue<string>,
            douyinContent: Annotation<string>,
        })

        const douyin_promptTemplate = ChatPromptTemplate.fromMessages([
            ['system', '你是抖音文案专家，请根据用户的产品生成抖音文案'],
            ['placeholder', '{query}'],
            ['placeholder', '{messages}'],
        ])

        const douyin_llmNode = (state: typeof DouyinState.State) => {
            const { messages, query } = state
            const { chatModel } = this
            const llm = chatModel.bindTools!([this.serpApi, gaoDeWeather])
            return douyin_promptTemplate
                .pipe(llm)
                .invoke({ messages, query })
                .then(aiMessage => ({
                    messages: [aiMessage],
                    douyinContent: aiMessage.content,
                }))
        }

        const douyin_toolNode = new ToolNode([this.serpApi, gaoDeWeather])

        const douyin_graph = new StateGraph(DouyinState)
            .addNode('llm', douyin_llmNode)
            .addNode('tools', douyin_toolNode)
            .addEdge(START, 'llm')
            .addEdge('tools', 'llm')
            .addConditionalEdges('llm', toolsCondition)
            .compile()

        const AppState = Annotation.Root({
            query: FirstValue<string>(),
            xhsContent: LastValue<string>(),
            douyinContent: LastValue<string>(),
        })

        const app_parallelNode = state => state
        const appGraph = new StateGraph(AppState)
            .addNode('parallel', app_parallelNode)
            .addNode('xhs', xhs_graph)
            .addNode('douyin', douyin_graph)
            .addEdge(START, 'parallel')
            .addEdge('parallel', 'xhs')
            .addEdge('parallel', 'douyin')
            .compile()
        return appGraph.invoke({ query: message })
    }

    CRAGAgent(thread_id: string, message: string) {
        // 使用langGraph建立一个评估模型，用于优化每一条文档
        const AssessState = Annotation.Root({
            quesition: Annotation<string>,
            document: Annotation<Document>,
            relevant: Annotation<boolean>,
            reason: Annotation<string>,
        })
        const promptOfAssess = ChatPromptTemplate.fromTemplate<{
            quesition: string
            document: string
        }>(
            concatTemplate(
                '请评估检索到的文档能否为用户的提问提供有价值的信息',
                '用户问题: {quesition}',
                '文档内容: {document}'
            )
        )
        const assessNode = (state: typeof AssessState.State) => {
            const chatModel = this.chatModel.withStructuredOutput(
                z.object({
                    valuable: z.boolean().describe('文档对于问题有无价值'),
                    reason: z.string().describe('有无价值的原因'),
                })
            )
            return promptOfAssess.pipe(chatModel).invoke({
                quesition: state.quesition,
                document: state.document.pageContent,
            })
        }

        const refiningOrReWriteEdge = (state: typeof AssessState.State) => {
            return state.relevant ? 'refining' : 'reWrite'
        }

        const promptOfRefining = ChatPromptTemplate.fromTemplate<{
            quesition: string
            docString: string
        }>(
            concatTemplate(
                '请根据问题精炼文档内容，剔除无关的，保留有价值的',
                '用户问题: {quesition}',
                '文档内容: {docString}'
            )
        )
        const refiningNode = (state: typeof AssessState.State) => {
            const chatModel = this.chatModel.withStructuredOutput(
                z.object({
                    docString: z.string().describe('优化后的文档内容'),
                })
            )
            return promptOfRefining
                .pipe(chatModel)
                .invoke({
                    quesition: state.quesition,
                    docString: state.document.pageContent,
                })
                .then(({ docString }) => ({
                    document: new Document({
                        pageContent: docString,
                    }),
                }))
        }

        const promptOfRewrite = ChatPromptTemplate.fromTemplate<{
            quesition: string
        }>(
            concatTemplate(
                '请理解用户问题中的语义/动机，优化提问，使其能够在网络中搜索出相关信息',
                '用户问题: {quesition}'
            )
        )
        const reWriteNode = (state: typeof AssessState.State) => {
            const chatModel = this.chatModel.withStructuredOutput(
                z.object({
                    quesition: z.string().describe('优化后的问题'),
                })
            )
            return promptOfRewrite
                .pipe(chatModel)
                .invoke(state)
                .then(result => ({
                    quesition: result.quesition,
                }))
        }

        const searchNode = (state: typeof AssessState.State) => {
            const { quesition } = state
            return this.serpApi.invoke(quesition).then(document => ({
                document,
            }))
        }

        const assessGraph = new StateGraph(AssessState)
            .addNode('assess', assessNode)
            .addNode('refining', refiningNode)
            .addNode('reWrite', reWriteNode)
            .addNode('search', searchNode)
            .addEdge(START, 'assess')
            .addConditionalEdges('assess', refiningOrReWriteEdge)
            .addEdge('reWrite', 'search')
            .compile()

        const AppState = Annotation.Root({
            quesition: Annotation<string>(),
            documents: Annotation<Document[]>(),
            answer: Annotation<string>(),
        })

        const promptOfAnswer = ChatPromptTemplate.fromTemplate<{
            quesition: string
            documents: string
        }>(
            concatTemplate(
                '请根据文档内容回答用户的问题',
                '文档内容: {documents}',
                '用户问题: {quesition}'
            )
        )

        const appRetrieveNode = async (state: typeof AppState.State) => {
            const { quesition } = state
            const { vectorStore, byteStore } = this
            const retriever = new MultiVectorRetriever({
                vectorstore: vectorStore,
                byteStore,
                idKey: 'doc_id',
                childK: 20,
                parentK: 5,
            })

            const res = await retriever.invoke(quesition).then(documents => ({
                documents,
            }))
            return res
        }

        const appAssessNode = (state: typeof AppState.State) => {
            const { documents, quesition } = state

            const assessInputs = documents.map(document => ({
                quesition,
                document,
            }))
            return assessGraph
                .batch(assessInputs, { maxConcurrency: 3 })
                .then(assessOutputs => ({
                    documents: assessOutputs.map(output => output.document),
                }))
        }

        const appAnswerNode = (state: typeof AppState.State) => {
            const { documents, quesition } = state
            return promptOfAnswer
                .pipe(this.chatModel)
                .pipe(new StringOutputParser())
                .invoke({
                    quesition,
                    documents: documents.join('\n'),
                })
                .then(answer => ({ answer }))
        }

        const appGraph = new StateGraph(AppState)
            .addNode('retrieveNode', appRetrieveNode)
            .addNode('assessNode', appAssessNode)
            .addNode('answerNode', appAnswerNode)
            .addEdge(START, 'retrieveNode')
            .addEdge('retrieveNode', 'assessNode')
            .addEdge('assessNode', 'answerNode')
            .compile()

        return appGraph.invoke({ quesition: message })
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
