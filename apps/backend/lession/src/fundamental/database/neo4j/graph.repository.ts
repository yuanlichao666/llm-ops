// import {
//     ChunkNode,
//     ExtractedEntity,
//     ExtractedRelation,
// } from '../../../modules/2.10.graph-rag/graph.entity'
// import { IGraphRepository } from '../../../modules/2.10.graph-rag/graph.repository'

export class GraphRepository {
    constructor() {}
    /**
     * 1. 写入切片并处理实体/关系 (索引阶段)
     * 在同一个事务中运行，确保数据一致性
     */
    // async upsertGraphData(
    //     chunk: ChunkNode,
    //     entities: ExtractedEntity[],
    //     relations: ExtractedRelation[]
    // ) {
    //     // const runner = tx || this.neo4jService.getWriteSession()
    //     // // 写入 Chunk 节点
    //     // await runner.run(`MERGE (c:Chunk {id: $id}) SET c.content = $content`, {
    //     //     id: chunk.id,
    //     //     content: chunk.content,
    //     // })
    //     // // 写入实体并合并描述 (LightRAG 核心逻辑)
    //     // for (const entity of entities) {
    //     //     await runner.run(
    //     //         `
    //     // MERGE (e:Entity {name: $name})
    //     // ON CREATE SET e.type = $type, e.description = $description
    //     // ON MATCH SET e.description = e.description + "\n" + $description
    //     // WITH e, $chunkId as cid
    //     // MATCH (c:Chunk {id: cid})
    //     // MERGE (c)-[:MENTIONS]->(e)
    //     // `,
    //     //         { ...entity, chunkId: chunk.id }
    //     //     )
    //     // }
    //     // // 写入关系
    //     // for (const rel of relations) {
    //     //     await runner.run(
    //     //         `
    //     // MATCH (s:Entity {name: $source}), (t:Entity {name: $target})
    //     // MERGE (s)-[r:RELATED {description: $description}]->(t)
    //     // ON CREATE SET r.weight = $weight
    //     // ON MATCH SET r.weight = r.weight + $weight
    //     // `,
    //     //         { ...rel }
    //     //     )
    //     // }
    // }

    // /**
    //  * 2. 局部检索 (Local Search Path)
    //  * 给定实体名，找它的邻居、关系以及关联的 Chunk
    //  */
    // async findLocalContext(entityNames: string[]) {
    //     //     const cypher = `
    //     //   MATCH (e:Entity) WHERE e.name IN $names
    //     //   OPTIONAL MATCH (e)-[r:RELATED]-(neighbor:Entity)
    //     //   OPTIONAL MATCH (e)<-[:MENTIONS]-(c:Chunk)
    //     //   RETURN e as target, collect(distinct r) as relations, collect(distinct c) as chunks
    //     // `
    //     //     const result = await this.neo4jService.read(cypher, {
    //     //         names: entityNames,
    //     //     })
    //     //     return result.records.map(rec => rec.toObject())
    // }

    // /**
    //  * 3. 全局检索 (Global Search Path)
    //  * 这里的逻辑可以根据关系权重或关键词匹配
    //  */
    // async findGlobalContext(keywords: string[]) {
    //     //     const cypher = `
    //     //   MATCH (s:Entity)-[r:RELATED]->(t:Entity)
    //     //   WHERE any(kw IN $keywords WHERE r.description CONTAINS kw)
    //     //   RETURN s.name as src, t.name as tgt, r.description as desc, r.weight as weight
    //     //   ORDER BY r.weight DESC LIMIT 10
    //     // `
    //     //     return this.neo4jService.read(cypher, { keywords })
    // }
}
