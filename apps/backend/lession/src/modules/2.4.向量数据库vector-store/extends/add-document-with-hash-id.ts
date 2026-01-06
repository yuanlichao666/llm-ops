import { Document } from '@langchain/core/documents'
import { EmbeddingsInterface } from '@langchain/core/embeddings'
import { VectorStore } from '@langchain/core/vectorstores'
import crypto from 'crypto'

type VectorStoreConstructor = new (
    embeddings: EmbeddingsInterface,
    dbConfig: Record<string, any>
) => VectorStore

type Options = {
    ids?: string[]
}

export function WithHashID() {
    const decorator = <T extends VectorStoreConstructor>(target: T) => {
        // const originalMethod = target.prototype.addDocuments

        // target.prototype.addDocuments = function (
        //   sourceDocuments: Document[],
        //   sourceOptions?: Options
        // ) {
        //   const [documents, options] = makeSureHasId(sourceDocuments, sourceOptions)
        //   return originalMethod.apply(this, [documents, options])
        // }

        return target as T
    }

    /**
     *
     * 确保options有ids
     * @param documents 源文档
     * @param options 源选项
     * @returns Document[], Options 处理后的文档
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function makeSureHasId(documents: Document[], options?: Options) {
        let ids: string[] = options?.ids ?? []

        if (ids.length) {
            // 如果传了ids，则校验ids是否与documents一一对应
            if (ids.length !== documents.length) {
                throw new Error('ids and documents must be the same length')
            }
        } else {
            // 如果没传ids，则使用doc中的id或者md5生成id
            ids = documents.map(
                doc =>
                    doc.id ??
                    crypto
                        .createHash('md5')
                        .update(doc.pageContent)
                        .digest('hex')
            )
        }
        options = options ?? {}
        options.ids = ids
        return [documents, options]
    }

    return decorator
}
