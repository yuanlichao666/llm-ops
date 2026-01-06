/**
 * 语义分割所需的数学工具函数
 */

/**
 * 计算数组的平均值 (Mean)。
 * @param data - 数字数组。
 * @returns 数组的平均值。
 */
export function mean(data: number[]): number {
    if (data.length === 0) return 0
    const sum = data.reduce((acc, val) => acc + val, 0)
    return sum / data.length
}

/**
 * 计算数组的标准差 (Standard Deviation)。
 * @param data - 数字数组。
 * @param meanValue - 可选的平均值，如果未提供则内部计算。
 * @returns 数组的标准差。
 */
export function standardDeviation(data: number[], meanValue?: number): number {
    if (data.length < 2) return 0
    const avg = meanValue ?? mean(data)
    const squareDiffs = data.map(value => {
        const diff = value - avg
        return diff * diff
    })
    const avgSquareDiff = mean(squareDiffs)
    return Math.sqrt(avgSquareDiff)
}

/**
 * 计算数组的 p 分位数 (Quantile)。
 * 使用线性插值方法 (R-7)。
 * @param data - 数字数组。
 * @param p - 分位数，介于 0 到 1 之间 (例如 0.5 为中位数)。
 * @returns 对应的分位数。
 */
export function quantile(data: number[], p: number): number {
    if (data.length === 0) return 0
    const sorted = [...data].sort((a, b) => a - b)
    const n = sorted.length

    // 线性插值方法 (R-7)
    const index = (n - 1) * p
    const lower = Math.floor(index)
    const upper = Math.ceil(index)

    if (lower === upper) {
        return sorted[lower]
    }

    const weight = index - lower
    return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * 计算数组的四分位距 (Interquartile Range, IQR)。
 * @param data - 数字数组。
 * @returns 四分位距 (Q3 - Q1)。
 */
export function interquartileRange(data: number[]): number {
    if (data.length === 0) return 0
    const q1 = quantile(data, 0.25)
    const q3 = quantile(data, 0.75)
    return q3 - q1
}

/**
 * 计算数组的 p 百分位数。
 * @param data - 数字数组。
 * @param p - 百分位数，介于 0 到 100 之间。
 * @returns 对应的百分位数。
 */
export function percentile(data: number[], p: number): number {
    return quantile(data, p / 100)
}

/**
 * 计算相邻距离的梯度（一阶差分）。
 * @param distances - 相邻句子嵌入的距离数组。
 * @returns 梯度数组。
 */
export function gradient(distances: number[]): number[] {
    const gradients: number[] = []
    for (let i = 0; i < distances.length - 1; i++) {
        gradients.push(distances[i + 1] - distances[i])
    }
    return gradients
}
