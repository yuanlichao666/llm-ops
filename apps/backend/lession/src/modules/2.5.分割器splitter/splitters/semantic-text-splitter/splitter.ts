import { Embeddings } from '@langchain/core/embeddings'
import { TextSplitter } from '@langchain/textsplitters'

import { Block } from './block'
import { SplitStrategy, strategyFactory } from './strategies'

type SemanticSplitterParams = {
    /**
     * 嵌入模型
     */
    embeddings: Embeddings
    /**
     * 句子分隔符
     */
    separator?: RegExp
    /**
     * 缓冲大小
     */
    bufferSize?: number
    /**
     * 分割阈值
     */
    thresholdAmount?: number
    /**
     * 分割策略,默认使用分为法
     */
    thresholdType?:
        | 'percentile'
        | 'standard_deviation'
        | 'interquartile'
        | 'gradient'
    /**
     * 期望的分块数量
     */
    numberOfChunks?: number
}

export class SemanticTextSplitter
    extends TextSplitter
    implements SemanticSplitterParams
{
    embeddings: Embeddings
    separator: RegExp
    bufferSize: number
    thresholdType:
        | 'percentile'
        | 'standard_deviation'
        | 'interquartile'
        | 'gradient'
    thresholdAmount: number
    numberOfChunks: number

    private splitStrategy: SplitStrategy

    constructor(fields: SemanticSplitterParams) {
        // 继承 TextSplitter 构造函数
        super()
        // 初始化参数
        const {
            embeddings,
            separator = /[.!?。！？]\s+/g,
            bufferSize = 1,
            thresholdAmount = 0.9,
            thresholdType = 'percentile',
            numberOfChunks = 0,
        } = fields

        this.embeddings = embeddings
        this.separator = separator
        this.bufferSize = bufferSize
        this.thresholdAmount = thresholdAmount
        this.thresholdType = thresholdType
        this.numberOfChunks = numberOfChunks
        this.splitStrategy = strategyFactory(
            thresholdType,
            thresholdAmount,
            numberOfChunks
        )
    }

    async splitText(document: string): Promise<string[]> {
        return Promise.resolve()
            .then(this.splitDocumentToBlocks.bind(this, document))
            .then(this.concatBufferToBlocksContext.bind(this))
            .then(this.calculateBlocksContextVector.bind(this))
            .then(this.calculateBlocksContextDistances.bind(this))
            .then(this.splitBlocksByStrategy.bind(this))
            .then(this.outputChunks.bind(this))
    }

    /**
     * 将文档拆分成文本块
     * @param text 文档
     * @returns 文本块
     */
    private splitDocumentToBlocks(text: string): Block[] {
        return text
            .split(this.separator)
            .filter(Boolean)
            .map(sentence => ({
                content: sentence,
                context: {
                    vector: [],
                    content: '',
                    distanceOfNext: 0,
                },
            }))
    }

    /**
     * 计算文本块的上下文向量
     * @param blocks 文本块
     * @returns 文本块
     */
    private async calculateBlocksContextVector(
        blocks: Block[]
    ): Promise<Block[]> {
        const vectors = await this.embeddings.embedDocuments(
            blocks.map(block => block.context.content)
        )
        for (let i = 0; i < blocks.length; i++) {
            blocks[i].context.vector = vectors[i]
        }
        return blocks
    }

    /**
     * 根据缓冲大小前后拼接句子
     * @param sentences 句子
     * @returns 文本块
     */
    private concatBufferToBlocksContext(blocks: Block[]): Block[] {
        const { bufferSize } = this
        const { length } = blocks

        for (let i = 0; i < blocks.length; i++) {
            const end = i + bufferSize > length ? length : i + bufferSize
            const start = i - bufferSize < 0 ? 0 : i - bufferSize
            const window = blocks.slice(start, end + 1)
            const content = window.map(block => block.content).join('')
            blocks[i].context.content = content
        }

        return blocks
    }

    /**
     * 计算文本嵌入向量之间的相似度
     * @param embeddings 文本嵌入向量
     * @returns 文本嵌入向量之间的相似度
     */
    private calculateBlocksContextDistances(blocks: Block[]): Block[] {
        for (let i = 0; i < blocks.length - 1; i++) {
            const distance = cosineSimilarity(
                blocks[i].context.vector,
                blocks[i + 1].context.vector
            )
            blocks[i].context.distanceOfNext = 1 - distance
        }
        return blocks
    }

    /**
     * 根据相似度分块
     * @param blocks 文本块
     * @param distances 文本块之间的相似度
     * @returns 分块后的文本
     */
    private splitBlocksByStrategy(blocks: Block[]): Block[][] {
        const { splitStrategy } = this
        const chunks = blocks.reduce((acc, block, index) => {
            const isNotFirst = index > 0
            const isBreakpoint = splitStrategy.isBreakpoint(index, blocks)
            if (isNotFirst && isBreakpoint) {
                const newChunk = [block]
                acc.push(newChunk)
            } else {
                const prevChunk = acc.pop() ?? []
                prevChunk.push(block)
                acc.push(prevChunk)
            }
            return acc
        }, [] as Block[][])
        return chunks
    }

    /**
     * 输出分块后的文本
     * @param chunks 分块后的文本
     * @returns 分块后的文本
     */
    outputChunks(chunks: Block[][]): string[] {
        const result = chunks.map(chunk =>
            chunk.map(block => block.content).join('')
        )
        return result
    }
}

/**
 * 计算两个文本嵌入向量之间的相似度
 * @param a 文本嵌入向量
 * @param b 文本嵌入向量
 * @returns 两个文本嵌入向量之间的相似度
 */
function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((acc, val, index) => acc + val * b[index], 0)
    const magnitudeA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0))
    return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * 关于四种标准差算法的解释
 * 首先我们计算出所有句子与相邻句子的差值[1-2,2-3,3-4...]，
 * 然后观察这些差值的变化规律，比如我们可以吧文章整体想象成一段水流，水流中会有一些波峰和波谷，
 * 我们期望将平稳的部分切割出来，这样得到的就会是语义连贯的知识库，基于这个抽象进一步的决定使用什么方法来分割文本，比如：
 *
 * 1. percentile: 分为法
 *      我们只在那些最不连贯的 x% 的地方进行切分，比如前5%、前10%、前15%。
 *      对噪音不敏感，适合连贯内容的文档，比如新闻报道、小说、散文等。
 *
 * 2. standard_deviation: 标准差法
 *      我们只在那些差值最大的地方进行切分，比如与平均值相差2倍、3倍、4倍。
 *      对噪音有一定敏感度，适合大部分正态，少部分离散的文档，如技术手册
 *      当文档中有少数几个主题突然转变时（异常值），该方法能灵敏捕捉。
 *
 * 3. interquartile: 四分位数法
 *      IQR 是衡量分散程度的一个鲁棒性（Robustness）指标，这意味着它不受极端异常值 (Outliers) 的影响。
 *      q1：0.25分位距离，q3：0.75分位距离，那么大部分数据的合理波动范围是：iqr = q3 - q1，
 *      一旦是75分位后面的数据，且超过了x倍iqr（合理波动范围），则认为这个数据是异常的。
 *      所以：阈值 = q3 + x * iqr
 *      解决极端噪声的干扰(标准差法当出现极大值时，会拉高平均值导致分割不准确)
 *      文档中包含大量结构性噪音，或者数据分布不均匀时，它比标准差法更稳定可靠。
 *
 * 4. Gradient：梯度法
 *      不看差异的值而是观察差异变化的趋势，
 *      如果出现了波峰后又变回平稳，说明语义迅速转变。
 *      比如相邻距离 $D_i$ 和 $D_{i+1}$ 的值本身很高，但 $D_{i+2}$ 突然下降，
 *      适用于主题过渡自然、平滑的文本（如文学评论、深度分析）。它能找到最佳的“切入点”或“转折点”。
 */
