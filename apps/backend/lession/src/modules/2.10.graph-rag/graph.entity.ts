// chunk.entity.ts
export class ChunkNode {
    id: string
    content: string
    metadata?: any
}

// graph-data.entity.ts
export interface ExtractedEntity {
    name: string
    type: string
    description: string // 提取到的当前描述
}

export interface ExtractedRelation {
    source: string
    target: string
    description: string
    weight: number
}
