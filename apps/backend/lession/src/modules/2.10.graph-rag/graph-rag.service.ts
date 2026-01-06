import { Embeddings } from '@langchain/core/embeddings'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { VectorStore } from '@langchain/core/vectorstores'
import { Injectable } from '@nestjs/common'
import { Inject } from '@nestjs/common'

// import { Transactional } from '@nestjs-cls/transactional'
import { GraphRepository } from '../../fundamental/database/neo4j/graph.repository'
// import { NEO4J_DRIVER } from '../../fundamental/database/neo4j/neo4j.provider'

@Injectable()
export class GraphRagService {
    constructor(
        private readonly self: GraphRagService,
        private readonly graphRepository: GraphRepository,
        @Inject('ChatModel') private readonly chatModel: BaseChatModel,
        @Inject('Embeddings') private readonly embeddings: Embeddings,
        @Inject('VectorStore') private readonly vectorStore: VectorStore
    ) {}

    // public async addDocuments(documents: Document[]) {
    //     //索引阶段
    //     // 1.分割文档
    //     // 2.建立实体、关系、chuank
    //     // 3.分配唯一id，两个库之间通过id双向关联
    //     // 4.存入图数据库
    //     // await this.self.saveToGraphDatabase(documents)
    //     // 5.存入向量库
    //     // return await this.vectorStore.addDocuments(documents)
    // }

    // @Transactional(NEO4J_DRIVER)
    // private saveToGraphDatabase(documents: Document[]) {}

    // private saveToVectorDatabase(documents: Document[]) {}
}
