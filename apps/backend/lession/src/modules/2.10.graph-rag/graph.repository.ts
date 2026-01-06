import { ChunkNode, ExtractedEntity, ExtractedRelation } from './graph.entity'

export interface IGraphRepository {
    /**
     * 1. 写入切片并处理实体/关系 (索引阶段)
     * 在同一个事务中运行，确保数据一致性
     */
    upsertGraphData(
        chunk: ChunkNode,
        entities: ExtractedEntity[],
        relations: ExtractedRelation[]
    ): Promise<any>

    /**
     * 2. 局部检索 (Local Search Path)
     * 给定实体名，找它的邻居、关系以及关联的 Chunk
     */
    findLocalContext(entityNames: string[]): Promise<any>

    /**
     * 3. 全局检索 (Global Search Path)
     * 这里的逻辑可以根据关系权重或关键词匹配
     */
    findGlobalContext(keywords: string[]): Promise<any>
}
