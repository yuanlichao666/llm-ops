import { Document } from '@langchain/core/documents'
import { BaseRetriever } from '@langchain/core/retrievers'

const mockDocuments: Document[] = [
    new Document({
        pageContent: 'Hello, world!',
        metadata: { source: 'mock' },
    }),
    new Document({
        pageContent: 'Hello, world!',
        metadata: { source: 'mock' },
    }),
    new Document({
        pageContent: 'Hello, world!',
        metadata: { source: 'mock' },
    }),
    new Document({
        pageContent: 'Hello, world!',
        metadata: { source: 'mock' },
    }),
]

export class SimpleCustomRetriever extends BaseRetriever {
    lc_namespace: string[] = ['SimpleCustomRetriever']

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async _getRelevantDocuments(query: string): Promise<Document[]> {
        return mockDocuments
    }
}
