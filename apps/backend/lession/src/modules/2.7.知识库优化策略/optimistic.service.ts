import { AttributeInfo } from '@langchain/classic/chains/query_constructor'
import { ContextualCompressionRetriever } from '@langchain/classic/retrievers/contextual_compression'
import { MultiVectorRetriever } from '@langchain/classic/retrievers/multi_vector'
import { ParentDocumentRetriever } from '@langchain/classic/retrievers/parent_document'
import { SelfQueryRetriever } from '@langchain/classic/retrievers/self_query'
import { LocalFileStore } from '@langchain/classic/storage/file_system'
import { formatDocumentsAsString } from '@langchain/classic/util/document'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history'
import { Document } from '@langchain/core/documents'
import { Embeddings } from '@langchain/core/embeddings'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { StringOutputParser } from '@langchain/core/output_parsers'
import {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
} from '@langchain/core/prompts'
import { BaseMessagePromptTemplate } from '@langchain/core/prompts'
import {
    Runnable,
    RunnableLambda,
    RunnableSequence,
} from '@langchain/core/runnables'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'
import { VectorStore } from '@langchain/core/vectorstores'
import { WeaviateTranslator } from '@langchain/weaviate'
import { Injectable } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import * as R from 'remeda'
import { z } from 'zod'

import { concatTemplate } from '../../helpers/concatTemplate'
import {
    map,
    parallel,
    pass,
    pick,
    serial,
    tap,
    value,
} from '../../helpers/operaters'
import {
    parallelQuestionsComposerPrompt,
    parallelQuestionsDecomposerPrompt,
    parallelQuestionsExecutorPrompt,
    serialQuestionsDecomposerPrompt,
    serialQuestionsExecutorPrompt,
} from '../0.templates'
import { CharacterTextSplitter } from '../2.5.分割器splitter/splitters/character-text-splitter'

@Injectable()
export class OptimisticService {
    private baseRetriever: Runnable<string, string>
    private hybridRetriever: Runnable<string, string>
    private fusionRetriever: Runnable<string, string>
    private stepBackRetriever: Runnable<string, string>
    private ensembleRetriever: Runnable<string, string>

    constructor(
        @Inject('Cache') private cache: LocalFileStore,
        @Inject('ChatModel') private chatModel: BaseChatModel,
        @Inject('Embeddings') private embeddings: Embeddings,
        @Inject('VectorStore') private vectorStore: VectorStore,
        @Inject('BaseRetriever') baseRetriever: VectorStoreRetriever,
        @Inject('HybridRetriever') hybridRetriever: VectorStoreRetriever,
        @Inject('FusionRetriever') fusionRetriever: VectorStoreRetriever,
        @Inject('EnsembleRetriever') ensembleRetriever: VectorStoreRetriever,
        @Inject('StepBackRetriever') stepBackRetriever: VectorStoreRetriever,
        @Inject('ParentDocumentRetriever')
        private parentDocumentRetriever: ParentDocumentRetriever,
        @Inject('RerankCompressRetriever')
        private rerankCompressRetriever: ContextualCompressionRetriever
    ) {
        this.chatModel = chatModel.withConfig({
            configurable: { temperature: 0 },
        }) as BaseChatModel
        this.baseRetriever = baseRetriever.pipe(formatDocumentsAsString)
        this.fusionRetriever = fusionRetriever.pipe(formatDocumentsAsString)
        this.hybridRetriever = hybridRetriever.pipe(formatDocumentsAsString)
        this.ensembleRetriever = ensembleRetriever.pipe(formatDocumentsAsString)
        this.stepBackRetriever = stepBackRetriever.pipe(formatDocumentsAsString)
    }

    // 输出解析器
    private outputString = new StringOutputParser()

    // 分割问题
    private splitQuestions = RunnableLambda.from((str: string) =>
        str.split('\n').filter(Boolean)
    ).withConfig({ runName: 'SplitQuestions' })

    async queryFusionRetriever(query: string) {
        const results = await this.fusionRetriever.invoke(query, {
            configurable: {
                temperature: 0,
            },
        })
        return results
    }

    async querySerialSubQuestions(query: string) {
        const { chatModel, outputString, splitQuestions, fusionRetriever } =
            this

        //------------------------------ 分解子问题 ------------------------------

        const decomposerChain = serialQuestionsDecomposerPrompt
            .pipe(chatModel)
            .pipe(outputString)
            .pipe(splitQuestions)
            .withConfig({ runName: 'DecomposerChain' })

        //------------------------------ 执行子问题 ------------------------------

        const executerChain = serialQuestionsExecutorPrompt
            .pipe(chatModel)
            .pipe(outputString)
            .withConfig({ runName: 'ExecuterChain' })

        //------------------------------ 问答对管理 ------------------------------

        const temp = new InMemoryChatMessageHistory([])
        const getHistory = RunnableLambda.from(() => {
            return temp
                .getMessages()
                .then(R.map(message => `${message.type}: ${message.content}`))
                .then(R.join('\n\n'))
        })

        //------------------------------ 完整的链 ------------------------------

        const finalChain = decomposerChain.pipe(
            serial(
                map({
                    context: pass().pipe(fusionRetriever),
                    question: tap(temp.addUserMessage),
                    qaHistory: getHistory,
                })
                    .pipe(executerChain)
                    .pipe(tap(temp.addAIMessage))
            ).withConfig({ runName: 'FinalChain' })
        )

        return finalChain.invoke({ question: query })
    }

    async queryParallelSubQuestions(query: string) {
        const { fusionRetriever, chatModel, outputString, splitQuestions } =
            this

        //------------------------------ 问答对管理 ------------------------------
        const temp = new InMemoryChatMessageHistory([])
        const getHistory = RunnableLambda.from(() => {
            return temp
                .getMessages()
                .then(R.map(message => `${message.type}: ${message.content}`))
                .then(R.join('\n\n'))
        })
        const addQaHistory = (qa: { question: string; answer: string }) => {
            temp.addUserMessage(qa.question)
            temp.addAIMessage(qa.answer)
        }

        // ------------------------------ 分解子问题 ------------------------------
        const decomposerChain = parallelQuestionsDecomposerPrompt
            .pipe(chatModel)
            .pipe(outputString)
            .pipe(splitQuestions)
            .withConfig({ runName: 'DecomposerChain' })

        // ------------------------------ 执行子问题 ------------------------------

        const subQaChain = parallelQuestionsExecutorPrompt
            .pipe(chatModel)
            .pipe(outputString)
            .withConfig({ runName: 'SubQaChain' })

        // ------------------------------ 合并子问题 ------------------------------

        const composerChain = parallelQuestionsComposerPrompt
            .pipe(chatModel)
            .pipe(outputString)
            .withConfig({ runName: 'ComposerChain' })
        //-------------------------------- 组合所有链 --------------------------------

        const fullChain = decomposerChain.pipe(
            parallel(
                map({
                    question: pass(),
                    context: pass().pipe(fusionRetriever),
                })
                    .pipe({
                        question: pick('question'),
                        answer: pass().pipe(subQaChain),
                    })
                    .pipe(tap(addQaHistory))
            )
                .pipe({
                    original: value(query),
                    qaHistory: getHistory,
                })
                .pipe(composerChain)
        )
        return fullChain.invoke({ question: query })
    }

    async queryStepBackRetriever(query: string) {
        const { stepBackRetriever, chatModel, outputString } = this

        const prompt = ChatPromptTemplate.fromMessages<{
            context: string
            question: string
        }>([
            [
                'system',
                '你是一个乐于助人的助手，请根据用户的提问和检索到的上下文回答问题\n当前的上下文：\n{context}',
            ],
            ['human', '{question}'],
        ])
        return RunnableSequence.from([
            stepBackRetriever,
            context => ({
                context,
                question: query,
            }),
            prompt,
            chatModel,
            outputString,
        ]).invoke(query)
    }

    async queryHybridRetriever(query: string) {
        const { hybridRetriever, chatModel, outputString } = this

        const systemTemplate = SystemMessagePromptTemplate.fromTemplate(
            concatTemplate(
                '你是一个乐于助人的助手，请根据用户的提问和检索到的上下文回答问题',
                '当前的上下文:',
                '{context}',
                '这是问题:',
                '{question}'
            )
        )

        const prompt = ChatPromptTemplate.fromMessages<{
            question: string
            context: string
        }>([systemTemplate])

        return RunnableSequence.from([
            hybridRetriever,
            context => ({
                context,
                question: query,
            }),
            prompt,
            chatModel,
            outputString,
        ]).invoke(query)
    }

    async queryEnsembleRetriever(query: string) {
        const { ensembleRetriever, chatModel, outputString } = this

        const systemTemplate = SystemMessagePromptTemplate.fromTemplate(
            concatTemplate(
                '你是一个乐于助人的助手，请根据用户的提问和检索到的上下文回答问题',
                '当前的上下文:',
                '{context}',
                '这是问题:',
                '{question}'
            )
        )

        const prompt = ChatPromptTemplate.fromMessages<{
            question: string
            context: string
        }>([systemTemplate])

        return RunnableSequence.from([
            ensembleRetriever,
            context => ({
                context,
                question: query,
            }),
            prompt,
            chatModel,
            outputString,
        ]).invoke(query)
    }

    async queryRetrieverRouter(query: string) {
        const { chatModel } = this

        const systemTemplate = SystemMessagePromptTemplate.fromTemplate(
            concatTemplate(
                '你是一个擅长根据用户问题路由到适当数据源的专家。',
                '根据用户的提问，选择最合适的数据源。',
                '用户的问题是：',
                '{question}'
            )
        )
        const prompt = ChatPromptTemplate.fromMessages([systemTemplate])

        const retrieverRouterSchema = z.object({
            retrieverRouter: z
                .enum(['js-docs', 'python-docs', 'java-docs'])
                .describe('可供查询的数据源')
                .default('python-docs'),
        })

        const structuredModel = chatModel.withStructuredOutput(
            retrieverRouterSchema,
            { name: 'retrieverRouter', method: 'functionCalling' }
        )

        return prompt.pipe(structuredModel).invoke({ question: query })
    }

    async queryPromotRouter(query: string) {
        const { embeddings, chatModel } = this

        const prompts = [
            //数学老师模版
            SystemMessagePromptTemplate.fromTemplate(
                concatTemplate(
                    '你是一个擅长数学的教师，请根据学生的提问，选择最合适的数据源。'
                )
            ),
            //物理老师模版
            SystemMessagePromptTemplate.fromTemplate(
                concatTemplate(
                    '你是一个擅长物理的教师，请根据学生的提问，选择最合适的数据源。'
                )
            ),
        ]

        const promptsWithVector = await embedPrompts(this.embeddings, prompts)
        const questionVector = await embeddings.embedQuery(query)

        return RunnableSequence.from([promptRouter, chatModel]).invoke({
            promptsWithVector: promptsWithVector,
            queryVector: questionVector,
        })
    }

    // 自建查询检索器，精准过滤
    async querySelfQueryRetriever(query: string) {
        const { chatModel, vectorStore } = this

        const documents = [
            new Document({
                pageContent: '肖申克的救赎',
                metadata: {
                    year: 1994,
                    rating: 9.7,
                    director: '弗兰克·德拉邦特',
                },
            }),
            new Document({
                pageContent: '霸王别姬',
                metadata: { year: 1993, rating: 9.6, director: '陈凯歌' },
            }),
            new Document({
                pageContent: '阿甘正传',
                metadata: {
                    year: 1994,
                    rating: 9.5,
                    director: '罗伯特·泽米吉斯',
                },
            }),
            new Document({
                pageContent: '泰坦尼克号',
                metadata: {
                    year: 1997,
                    rating: 9.5,
                    director: '詹姆斯·卡梅隆',
                },
            }),
            new Document({
                pageContent: '千与千寻',
                metadata: { year: 2001, rating: 9.4, director: '宫崎骏' },
            }),
            new Document({
                pageContent: '星际穿越',
                metadata: {
                    year: 2014,
                    rating: 9.4,
                    director: '克里斯托弗·诺兰',
                },
            }),
            new Document({
                pageContent: '忠犬八公的故事',
                metadata: {
                    year: 2009,
                    rating: 9.4,
                    director: '莱塞·霍尔斯道姆',
                },
            }),
            new Document({
                pageContent: '三傻大闹宝莱坞',
                metadata: {
                    year: 2009,
                    rating: 9.2,
                    director: '拉库马·希拉尼',
                },
            }),
            new Document({
                pageContent: '疯狂动物城',
                metadata: { year: 2016, rating: 9.2, director: '拜伦·霍华德' },
            }),
            new Document({
                pageContent: '无间道',
                metadata: { year: 2002, rating: 9.3, director: '刘伟强' },
            }),
        ]

        await vectorStore.addDocuments(documents)

        const attributeInfo: AttributeInfo[] = [
            new AttributeInfo('year', 'number', '电影的年份'),
            new AttributeInfo('rating', 'number', '电影的评分'),
            new AttributeInfo('director', 'string', '电影的导演'),
        ]

        const selfQueryRetriever = SelfQueryRetriever.fromLLM({
            llm: chatModel,
            vectorStore: vectorStore,
            documentContents: '电影的名字',
            attributeInfo: attributeInfo,
            structuredQueryTranslator: new WeaviateTranslator(),
        })
        return selfQueryRetriever.invoke(query)
    }

    /**
     *
     * 多表征/向量索引：
     * 核心是针对同一份文档，生成多个表征/向量（标题、摘要、假设、子文档）存到向量数据库
     * 这样在查询的时候就能根据不同的向量检索到同一份内容，大大提升召回率
     * 生成多表征 >>>  检索多表征 >>> 拿到原文id >>> 获取原文内容 >>> 返回给用户
     */

    // 基于摘要的多表征索引(添加文档)
    async addMultiVectorDocs(text: string) {
        const { vectorStore, chatModel, outputString, cache } = this
        //------------------------------ 常量和工具函数 ------------------------------

        const prompt =
            ChatPromptTemplate.fromTemplate('总结以下文档的内容。\n{text}')

        // 分成多个原始文档
        const splitter = new CharacterTextSplitter({
            separator: '\n',
            chunkSize: 500,
            keepSeparator: false,
            chunkOverlap: 0,
        })

        // 设置文档元数据id
        const setDocId = R.map(
            (doc: Document) => (
                (doc.metadata.doc_id = crypto.randomUUID()),
                doc
            )
        )

        // 将文档转换成 [key:buffer]
        const toRecords = R.map(
            (doc: Document) =>
                [
                    doc.metadata.doc_id!,
                    new TextEncoder().encode(JSON.stringify(doc)),
                ] as [string, Uint8Array]
        )

        // 设置文档关联关系
        const makeRelation = R.zipWith(
            (doc: Document, sourceDoc: Document) => ({
                ...doc,
                metadata: {
                    ...doc.metadata,
                    doc_id: sourceDoc.metadata.doc_id!,
                },
            })
        )

        // 根据文本创建文档
        const createDocuments = R.map(
            (text: string) =>
                new Document({
                    pageContent: text,
                })
        )

        // ------------------------------ 核心逻辑 ------------------------------
        // 将文本分割成文档
        const sourceDocs = await Promise.resolve([text])
            .then(texts => splitter.createDocuments(texts))
            .then(docs => setDocId(docs))

        // 总结文档内容
        const summarize = RunnableSequence.from([
            { text: pick('pageContent') },
            prompt,
            chatModel,
            outputString,
        ])

        // 向byteStore中存储原始文档
        await R.pipe(sourceDocs, toRecords, records => cache.mset(records))

        // 向vectorStore中存储总结后的文档
        return await Promise.resolve(sourceDocs)
            .then(docs => summarize.batch(docs))
            .then(txts => createDocuments(txts))
            .then(docs => makeRelation(docs, sourceDocs))
            .then(docs => vectorStore.addDocuments(docs))
    }

    // 基于摘要的多表征索引（查询文档）
    async queryMultiVectorRetriever(query: string) {
        const { vectorStore, cache } = this

        const retriever = new MultiVectorRetriever({
            vectorstore: vectorStore,
            byteStore: cache,
            idKey: 'doc_id',
            childK: 20,
            parentK: 10,
        })

        return retriever.invoke(query)
    }

    // 基于子文档的多表征索引(添加文档)
    async addDocsUseParentDocumentRetriever(file: Blob) {
        const documents = await new DocxLoader(file).load()
        return this.parentDocumentRetriever.addDocuments(documents)
    }

    // 基于子文档的多表征索引(查询文档)
    queryParentDocumentRetriever(query: string) {
        return this.parentDocumentRetriever.invoke(query)
    }

    // rerank重排序提升检索器效果
    queryRerankCompressRetriever(query: string) {
        return this.rerankCompressRetriever.invoke(query)
    }
}

function promptRouter(params: {
    promptsWithVector: { prompt: BaseMessagePromptTemplate; vector: number[] }[]
    queryVector: number[]
}) {
    const { promptsWithVector, queryVector } = params
    if (promptsWithVector.length === 0) {
        return null
    }
    return promptsWithVector
        .map(prompt => {
            const distance = cosineDistance(prompt.vector, queryVector)
            return {
                ...prompt,
                distance,
            }
        })
        .sort()[0].prompt
}

const cosineDistance = (a: number[], b: number[]) => {
    const dotProduct = a.reduce((acc, curr, index) => acc + curr * b[index], 0)
    const magnitudeA = Math.sqrt(a.reduce((acc, curr) => acc + curr * curr, 0))
    const magnitudeB = Math.sqrt(b.reduce((acc, curr) => acc + curr * curr, 0))
    return dotProduct / (magnitudeA * magnitudeB)
}

async function embedPrompts(
    embeddings: Embeddings,
    prompts: BaseMessagePromptTemplate<any, any>[]
) {
    const formattedPrompts = await Promise.all(
        prompts.map(async prompt => {
            const formattedPrompt = await prompt.formatMessages({})
            return new StringOutputParser().invoke(formattedPrompt[0])
        })
    )

    return embeddings.embedDocuments(formattedPrompts).then(vectors =>
        vectors.map((vector, index) => ({
            prompt: prompts[index],
            vector,
        }))
    )
}
