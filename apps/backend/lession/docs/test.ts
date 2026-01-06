// import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
// import { Document } from '@langchain/core/documents'
// import { Embeddings } from '@langchain/core/embeddings'
// import { BaseChatModel } from '@langchain/core/language_models/chat_models'
// import { ChatPromptTemplate } from '@langchain/core/prompts'
// import { RunnableLambda, RunnablePassthrough } from '@langchain/core/runnables'
// import { VectorStore } from '@langchain/core/vectorstores'
// import {
//     CharacterTextSplitter,
//     RecursiveCharacterTextSplitter,
// } from '@langchain/textsplitters'
// import { Inject, Injectable } from '@nestjs/common'
// import { join } from 'path'

// import { CustomDocumentLoader } from '../src/2.1.文档加载器document-loader/custom-document-loader'
// import { MemoryInterface } from '../src/2.2.langchain_memory/langchain-memory.provider'

// const documents = [
//     {
//         pageContent: '你好，我是小明',
//         metadata: { source: 'source1' },
//     },
//     {
//         pageContent: '高育良被称为植物',
//         metadata: { source: 'source2' },
//     },
//     {
//         pageContent: '我喜欢猫，我养了一只猫',
//         metadata: { source: 'source2' },
//     },
//     {
//         pageContent: '这是一段关于人工智能的介绍',
//         metadata: { source: 'source3' },
//     },
// ]

// const cosineDistance = (a: number[], b: number[]) => {
//     const dotProduct = a.reduce((acc, curr, index) => acc + curr * b[index], 0)
//     const magnitudeA = Math.sqrt(a.reduce((acc, curr) => acc + curr * curr, 0))
//     const magnitudeB = Math.sqrt(b.reduce((acc, curr) => acc + curr * curr, 0))
//     return dotProduct / (magnitudeA * magnitudeB)
// }

// @Injectable()
// export class RagService {
//     constructor(
//         @Inject('Memory') private memory: MemoryInterface,

//         @Inject('ChatModel') private chatModel: BaseChatModel,

//         @Inject('Embeddings') private embeddings: Embeddings,

//         @Inject('CacheBackedEmbeddings')
//         private cacheBackedEmbeddings: Embeddings,

//         @Inject('FaissStore') private faissStore: VectorStore,

//         @Inject('WeaviateStore') private weaviateVectorStore: VectorStore,

//         @Inject('CustomVectorStore') private customVectorStore: VectorStore
//     ) {}

//     async embeddingUsage(query: string) {
//         const vectors = await this.embeddings.embedDocuments(
//             documents.map(doc => doc.pageContent)
//         )
//         const target = await this.embeddings.embedQuery(query)

//         const similars = vectors
//             .map((vector, index) => {
//                 return {
//                     distance: cosineDistance(vector, target),
//                     document: documents[index],
//                     index,
//                 }
//             })
//             .sort((a, b) => b.distance - a.distance)

//         return similars.slice(0, 1)
//     }

//     // 使用缓存的嵌入查询,手动实现查询方法在内存中检索数据
//     async embeddingWithCacheUsage(query: string) {
//         const vectors = await this.cacheBackedEmbeddings.embedDocuments(
//             documents.map(doc => doc.pageContent)
//         )
//         const target = await this.cacheBackedEmbeddings.embedQuery(query)

//         const similars = vectors
//             .map((vector, index) => {
//                 return {
//                     distance: cosineDistance(vector, target),
//                     document: documents[index],
//                     index,
//                 }
//             })
//             .sort((a, b) => b.distance - a.distance)

//         return similars.slice(0, 1)
//     }

//     // 将嵌入的数据存储在向量数据库中供后续查询
//     async addDocumentsUseFaissStore(docs: string[]) {
//         const documentsToAdd = docs.map(
//             doc => new Document({ pageContent: doc, metadata: {} })
//         )
//         return await this.faissStore.addDocuments(documentsToAdd)
//     }

//     async queryUseFaissStore(query: string) {
//         const results = await this.faissStore.similaritySearch(query, 1)
//         return results
//     }

//     async addDocumentsUseWeaviateStore(docs: string[]) {
//         const documentsToAdd = docs.map(
//             doc => new Document({ pageContent: doc, metadata: {} })
//         )
//         return await this.weaviateVectorStore.addDocuments(documentsToAdd)
//     }

//     async queryUseWeaviateStore(query: string) {
//         const results = await this.weaviateVectorStore.similaritySearch(
//             query,
//             1
//         )
//         return results
//     }

//     async addDocumentsUseCustomStore(docs: string[]) {
//         const documentsToAdd = docs.map(
//             doc => new Document({ pageContent: doc, metadata: {} })
//         )
//         return await this.customVectorStore.addDocuments(documentsToAdd)
//     }

//     async queryUseCustomStore(query: string) {
//         const results = await this.customVectorStore.similaritySearch(query, 1)
//         return results
//     }

//     async firstAgent(message: string) {
//         const systemMessage =
//             '你是一个助手，请回答用户的问题\n' +
//             'context: {context}\n' +
//             'history: {history}'

//         const prompt = ChatPromptTemplate.fromMessages([
//             { role: 'system', content: systemMessage },
//             { role: 'user', content: '{question}' },
//         ])

//         const retrieve = RunnableLambda.from<{ question: string }, string>(
//             ({ question }) =>
//                 this.customVectorStore
//                     .asRetriever()
//                     .invoke(question)
//                     .then(combineDocuments)
//         )
//         const passContext = RunnablePassthrough.assign({ context: retrieve })

//         const withHistoryAndContext = this.memory.wrap(
//             passContext.pipe(prompt).pipe(this.chatModel)
//         )

//         return withHistoryAndContext.invoke({ question: message })
//     }
//     /**
//      * 基础文本文件加载器
//      * TextLoader
//      * @returns
//      */
//     async textLoaderUsage() {
//         const filePath = join(process.cwd(), 'test.txt')
//         const loader = new TextLoader(filePath)
//         const docs = await loader.load()
//         return docs
//     }

//     /**
//      * 自定义文档加载器
//      * CustomDocumentLoader
//      */
//     async customDocumentLoaderUsage() {
//         const filePath = join(process.cwd(), 'test.txt')
//         const loader = new CustomDocumentLoader(filePath)
//         const docs = await loader.load()
//         return docs
//     }

//     /**
//      * 基础文本分割器
//      * CharacterTextSplitter
//      */
//     async characterTextSplitterUsage() {
//         const loader = new TextLoader(join(process.cwd(), 'test.txt'))
//         const spliter = new CharacterTextSplitter({
//             separator: '\n',
//             chunkSize: 100,
//             chunkOverlap: 20,
//             keepSeparator: true,
//         })
//         const docs = await loader.load()
//         const chunks = await spliter.splitDocuments(docs)
//         return chunks.map(chunk => ({
//             ...chunk,
//             //输出查看CharacterTextSplitter分割后的内容仍然有文本长度存在超出限制的
//             length: chunk.pageContent.length,
//         }))
//     }

//     /**
//      * 递归文本分割器
//      * RecursiveCharacterTextSplitter
//      */
//     async recursiveCharacterTextSplitterUsage() {
//         const loader = new TextLoader(join(process.cwd(), 'test.txt'))
//         const spliter = new RecursiveCharacterTextSplitter({
//             chunkSize: 100,
//             chunkOverlap: 20,
//         })
//         const docs = await loader.load()
//         const chunks = await spliter.splitDocuments(docs)
//         return chunks.map(chunk => ({
//             ...chunk,
//             length: chunk.pageContent.length,
//         }))
//     }

//     /**
//      * 使用递归文本分割器分割代码
//      * RecursiveCharacterTextSplitter
//      */
//     async recursiveCharacterTextSplitterCodeUsage() {
//         const loader = new TextLoader(join(process.cwd(), 'test.js'))
//         const spliter = RecursiveCharacterTextSplitter.fromLanguage('js', {
//             chunkSize: 100,
//             chunkOverlap: 20,
//         })
//         const docs = await loader.load()
//         const chunks = await spliter.splitDocuments(docs)
//         return chunks.map(chunk => ({
//             ...chunk,
//             length: chunk.pageContent.length,
//         }))
//     }
// }

// function combineDocuments(documents: Document[]) {
//     return documents.map(doc => doc.pageContent).join('\n')
// }
