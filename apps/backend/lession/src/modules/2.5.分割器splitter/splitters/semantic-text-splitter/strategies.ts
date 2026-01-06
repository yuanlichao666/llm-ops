import { mean, quantile, standardDeviation } from '../../../../helpers/math'
import { Block } from './block'

/**
 * 分割策略抽象类
 */
export abstract class SplitStrategy {
    distances: number[]
    initialized: boolean

    private init(blocks: Block[]) {
        if (!this.initialized) {
            this.distances = blocks.map(block => block.context.distanceOfNext)
            this.initialized = true
            this._init(blocks)
        }
    }

    isBreakpoint(index: number, blocks?: Block[]): boolean {
        if (blocks) {
            this.init(blocks)
        }
        return this._isBreakpoint(index)
    }

    protected abstract _init(blocks: Block[]): void

    protected abstract _isBreakpoint(index: number): boolean
}

/**
 * 分为法：属于通用分割法，将分位数内的距离视作正常数据，分位数外的距离视作异常数据，
 * @param thresholdAmount 阈值，默认0.7分位数
 * @param numberOfChunks 可选，期望的分块数量
 */
export class Percentile extends SplitStrategy {
    private threshold: number

    constructor(
        private thresholdAmount: number = 0.7,
        private numberOfChunks?: number
    ) {
        super()
    }

    protected _init(): void {
        const { distances, numberOfChunks, thresholdAmount } = this
        let p = 0
        if (numberOfChunks) {
            p = 1 - (numberOfChunks - 1) / distances.length!
        } else {
            p = thresholdAmount
        }
        this.threshold = quantile(distances, p)
    }

    protected _isBreakpoint(index: number): boolean {
        const distance = this.distances[index]
        return distance > this.threshold
    }
}

/**
 * 标准差法：适用有语义转折但不大的文档
 * @param thresholdAmount 阈值，默认2倍标准差
 */
export class StandardDeviation extends SplitStrategy {
    private threshold: number

    constructor(private readonly thresholdAmount: number = 2) {
        super()
    }

    protected _init(): void {
        const { distances, thresholdAmount } = this
        const avg = mean(distances)
        const std = standardDeviation(distances)
        this.threshold = avg + std * thresholdAmount
    }

    protected _isBreakpoint(index: number): boolean {
        return this.distances[index] > this.threshold
    }
}

/**
 * 四分位数法：适用存在极端语义转折的文档
 * @param thresholdAmount 阈值，默认1.5倍iqr
 */
export class Interquartile extends SplitStrategy {
    private threshold: number

    constructor(private readonly thresholdAmount: number = 1.5) {
        super()
    }

    protected _init(): void {
        const { distances, thresholdAmount } = this
        const q1 = quantile(distances, 0.25)
        const q3 = quantile(distances, 0.75)
        const iqr = q3 - q1
        this.threshold = q3 + thresholdAmount * iqr
    }

    protected _isBreakpoint(index: number): boolean {
        return this.distances[index] > this.threshold
    }
}

/**
 * 梯度法：适用于主题过渡自然、平滑的文本（如文学评论、深度分析）
 * @param thresholdAmount 阈值，主题突然下降的大小，默认0.1
 */
export class Gradient extends SplitStrategy {
    private breakpoints: Map<number, boolean> = new Map()

    constructor(private readonly thresholdAmount: number = 0.1) {
        super()
    }

    protected _init(): void {
        for (let i = 0; i < this.distances.length - 1; i++) {
            const d1 = this.distances[i]
            const d2 = this.distances[i + 1]
            const d3 = this.distances[i + 2]
            if (d1 > d2 && d2 < d3) {
                if (d1 - d2 > this.thresholdAmount) {
                    this.breakpoints.set(i, true)
                }
            }
        }
    }

    protected _isBreakpoint(index: number): boolean {
        return Boolean(this.breakpoints.get(index))
    }
}

export function strategyFactory(
    type: 'percentile' | 'standard_deviation' | 'interquartile' | 'gradient',
    threshold: number,
    numberOfChunks?: number
): SplitStrategy {
    switch (type) {
        case 'percentile':
            return new Percentile(threshold, numberOfChunks)
        case 'standard_deviation':
            return new StandardDeviation(threshold)
        case 'interquartile':
            return new Interquartile(threshold)
        case 'gradient':
            return new Gradient(threshold)
        default:
            return new Percentile(threshold, numberOfChunks)
    }
}
