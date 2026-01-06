import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { Embeddings } from '@langchain/core/embeddings'
import { VectorStore } from '@langchain/core/vectorstores'
import {
    CharacterTextSplitter,
    RecursiveCharacterTextSplitter,
} from '@langchain/textsplitters'
import { Inject, Injectable } from '@nestjs/common'
import { join } from 'path'

import { CustomDocumentLoader } from './custom-document-loader'
import { SemanticTextSplitter } from './splitters/semantic-text-splitter'

@Injectable()
export class SplitterService {
    constructor(
        @Inject('Embeddings') private readonly embeddings: Embeddings,
        @Inject('VectorStore') private readonly vectorStore: VectorStore
    ) {}

    /**
     * 基础文本文件加载器
     * TextLoader
     * @returns
     */
    async textLoaderUsage() {
        const filePath = join(process.cwd(), 'docs/test.txt')
        const loader = new TextLoader(filePath)
        const docs = await loader.load()
        return docs
    }

    /**
     * 自定义文档加载器
     * CustomDocumentLoader
     */
    async customDocumentLoaderUsage() {
        const filePath = join(process.cwd(), 'docs/test.txt')
        const loader = new CustomDocumentLoader(filePath)
        const docs = await loader.load()
        return docs
    }

    /**
     * 基础文本分割器
     * CharacterTextSplitter
     */
    async characterTextSplitterUsage() {
        const loader = new TextLoader(join(process.cwd(), 'docs/test.txt'))
        const spliter = new CharacterTextSplitter({
            separator: '\n',
            chunkSize: 100,
            chunkOverlap: 20,
            keepSeparator: true,
        })
        const docs = await loader.load()
        const chunks = await spliter.splitDocuments(docs)
        return chunks.map(chunk => ({
            ...chunk,
            //输出查看CharacterTextSplitter分割后的内容仍然有文本长度存在超出限制的
            length: chunk.pageContent.length,
        }))
    }

    /**
     * 递归文本分割器
     * RecursiveCharacterTextSplitter
     */
    async recursiveCharacterTextSplitterUsage() {
        const loader = new TextLoader(join(process.cwd(), 'docs/test.txt'))
        const spliter = new RecursiveCharacterTextSplitter({
            chunkSize: 100,
            chunkOverlap: 20,
        })
        const docs = await loader.load()
        const chunks = await spliter.splitDocuments(docs)
        return chunks.map(chunk => ({
            ...chunk,
            length: chunk.pageContent.length,
        }))
    }

    /**
     * 使用递归文本分割器分割代码
     * RecursiveCharacterTextSplitter
     */
    async splitCode() {
        const loader = new TextLoader(join(process.cwd(), 'test.ts'))
        const spliter = RecursiveCharacterTextSplitter.fromLanguage('js', {
            chunkSize: 100,
            chunkOverlap: 20,
        })
        const docs = await loader.load()
        const chunks = await spliter.splitDocuments(docs)
        return chunks.map(chunk => ({
            ...chunk,
            length: chunk.pageContent.length,
        }))
    }

    /** 自定义多级分隔符
     * RecursiveCharacterTextSplitter
     */
    async customSeparator() {
        const loader = new TextLoader(join(process.cwd(), 'docs/test.txt'))
        const spliter = new RecursiveCharacterTextSplitter({
            separators: [
                '\n\n',
                '\n',
                '。|！|？|.s|!s|?s', //英文标点符号后面通常需要加空格
                '；|;s',
                '，|,s',
                ' ',
                '',
            ],
            chunkSize: 150,
            chunkOverlap: 20,
        })
        const docs = await loader.load()
        const chunks = await spliter.splitDocuments(docs)
        return chunks.map(chunk => chunk.pageContent).join('\n\n')
    }

    /** 将分隔符交给用户控制
     *  recursiveCharacterTextSplitter
     */
    async splitWithUserSeparator(
        separators: string[],
        chunkSize: number,
        chunkOverlap: number
    ) {
        const loader = new TextLoader(join(process.cwd(), 'docs/test.txt'))
        const spliter = new RecursiveCharacterTextSplitter({
            separators,
            chunkSize,
            chunkOverlap,
        })
        const docs = await loader.load()
        const chunks = await spliter.splitDocuments(docs)
        return chunks.map(chunk => chunk.pageContent).join('\n\n')
    }

    /**
     * 语义文本分割器
     */
    async semanticTextSplitterUsage() {
        const loader = new TextLoader(join(process.cwd(), 'docs/gradient.txt'))
        const splitter = new SemanticTextSplitter({
            embeddings: this.embeddings,
            separator: /[\n\n|\n|。|！|？|.s|!s|?s]/g,
            thresholdType: 'standard_deviation',
            thresholdAmount: 0.9,
            // numberOfChunks: 7,
        })
        const docs = await loader.load()
        const chunks = await splitter.splitDocuments(docs)
        return chunks.map(chunk => chunk.pageContent).join('\n\n')
    }

    async embddingWithSemanticTextSplitter(
        text: string,
        splitterParams: {
            thresholdType:
                | 'percentile'
                | 'standard_deviation'
                | 'interquartile'
                | 'gradient'
            thresholdAmount?: number
            numberOfChunks?: number
            separator?: RegExp
        }
    ) {
        const splitter = new SemanticTextSplitter({
            embeddings: this.embeddings,
            ...splitterParams,
        })

        const docs = await splitter.createDocuments([text])
        return await this.vectorStore.addDocuments(docs)
    }
}
