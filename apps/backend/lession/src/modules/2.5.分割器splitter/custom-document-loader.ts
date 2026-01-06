import { BufferLoader } from '@langchain/classic/document_loaders/fs/buffer'
import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { BaseDocumentLoader } from '@langchain/core/document_loaders/base'
import { Document } from '@langchain/core/documents'
import { readFile } from 'fs/promises'
/**
 * langchain中的文档处理分为加载器（加载、解析）、分割器（documents处理）
 * 加载器基类是抽象类BaseDocumentLoader，在此基础上派生TextLoader、BufferLoader
 * 业务侧基于TextLoader、BufferLoader实现了csvLoader、excelLoader等
 * 通过父类读取buffer或文本，自身实现解析方法
 */

/**
 * 需要加载特定文件时只需要查找现成的文件解析器，然后交给文件分割器处理即可
 * 如果有特殊需求，可以根据需要实现/继承BaseDocumentLoader、
 * TextLoader、BufferLoader定义自己的文件解析器
 */

export class CustomDocumentLoader implements BaseDocumentLoader {
    constructor(public readonly filePath: string) {}
    async load(): Promise<Document[]> {
        try {
            const text = await readFile(this.filePath, 'utf-8')
            const docs = text.split('\n').map(line => {
                return new Document({
                    pageContent: line,
                    metadata: { source: this.filePath },
                })
            })
            return docs
        } catch (error) {
            throw new Error(
                `Failed to load document from ${this.filePath}: ${error}`
            )
        }
    }
}

// 如果要重写解析规则，比如继续文本的解析(通常没什么必要)，继承这个
export class CustomDocumentLoader2 extends TextLoader {
    constructor(filePath: string) {
        super(filePath)
    }
    async parse(raw: string): Promise<string[]> {
        return raw.split('\n')
    }
}

// 如果要重写解析规则，比如自定义buffer的解析，继承这个
export class CustomDocumentLoader3 extends BufferLoader {
    constructor(filePathOrBlob: string | Blob) {
        super(filePathOrBlob)
    }
    async parse(
        buffer: Buffer,
        metadata: Document['metadata']
    ): Promise<Document[]> {
        // eslint-disable-next-line no-console
        console.log('metadata', metadata)

        const text = buffer.toString('utf-8')
        return text.split('\n').map(line => {
            return new Document({
                pageContent: line,
                metadata: { source: this.filePathOrBlob },
            })
        })
    }
}
