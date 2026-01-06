import { ParentDocumentRetriever } from '@langchain/classic/retrievers/parent_document'
import { LocalFileStore } from '@langchain/classic/storage/file_system'
import { VectorStore } from '@langchain/core/vectorstores'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

function parentDocumentRetrieverFactory(
    vectorStore: VectorStore,
    byteStore: LocalFileStore
) {
    return new ParentDocumentRetriever({
        vectorstore: vectorStore,
        byteStore: byteStore,
        // 如果父文档本身比较大，也可以传入parentSplitter来分割父文档
        parentSplitter: new RecursiveCharacterTextSplitter({
            chunkOverlap: 50,
            chunkSize: 500,
        }),
        childSplitter: new RecursiveCharacterTextSplitter({
            chunkOverlap: 0,
            chunkSize: 50,
        }),
        childK: 500,
        parentK: 50,
    })
}

export const ParentDocumentRetrieverProvider = {
    provide: 'ParentDocumentRetriever',
    useFactory: (vectorStore: VectorStore, byteStore: LocalFileStore) => {
        return parentDocumentRetrieverFactory(vectorStore, byteStore)
    },
    inject: ['VectorStore', 'ByteStore'],
}
