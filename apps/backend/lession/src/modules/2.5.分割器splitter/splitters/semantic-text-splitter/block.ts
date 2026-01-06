export interface Block {
    content: string
    context: {
        vector: number[]
        content: string
        distanceOfNext: number
    }
}
