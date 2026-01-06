import { FaissStore } from '@langchain/community/vectorstores/faiss'
import { Embeddings } from '@langchain/core/embeddings'

import { WithHashID } from '../extends/add-document-with-hash-id'

const FaissStoreWithHashID = WithHashID()(FaissStore)

export async function FaissStoreFactory(embeddings: Embeddings) {
    return await FaissStoreWithHashID.fromDocuments([], embeddings)
}

export const FaissStoreProvider = {
    provide: 'FaissStore',
    useFactory: FaissStoreFactory,
    inject: ['Embeddings'],
}
