import { Annotation } from '@langchain/langgraph'

/**
 * 覆盖模式 - 直接用新值覆盖旧值
 * 用于：单个值字段，后来的值替换之前的值
 * 例如：状态、配置项
 */
export function Override<T>(defaultValue?: () => T) {
    return Annotation<T>({
        reducer: (_, newValue) => newValue,
        ...(defaultValue && { default: defaultValue }),
    })
}

/**
 * 最后值模式 - 保留最后一个非空值
 * 用于：可选字段，优先使用新值，新值为空时保留旧值
 * 例如：用户输入、可选配置
 */
export function LastValue<T>(defaultValue?: () => T) {
    return Annotation<T>({
        reducer: (existing, newValue) => newValue ?? existing,
        ...(defaultValue && { default: defaultValue }),
    })
}

export function FirstValue<T>(defaultValue?: () => T) {
    return Annotation<T>({
        reducer: (existing, newValue) => existing ?? newValue,
        ...(defaultValue && { default: defaultValue }),
    })
}

/**
 * 累加模式（数组） - 将新元素追加到数组末尾
 * 用于：日志、历史记录、列表
 * 例如：操作历史、消息列表
 */
export function Append<T>(defaultValue: () => T[] = () => []) {
    return Annotation<T[]>({
        reducer: (existing, newItems) => [...existing, ...newItems],
        default: defaultValue,
    })
}

/**
 * 相加模式（数字） - 累加所有更新的值
 * 用于：计数器、统计、分数
 * 例如：访问次数、积分
 */
export function Sum(defaultValue: () => number = () => 0) {
    return Annotation<number>({
        reducer: (existing, increment) => existing + increment,
        default: defaultValue,
    })
}

/**
 * 合并模式（对象） - 浅合并对象属性
 * 用于：配置对象、元数据
 * 例如：用户信息、设置项
 */
export function Merge<T extends Record<string, any>>(
    defaultValue: () => T = () => ({}) as T
) {
    return Annotation<T>({
        reducer: (existing, updates) => ({ ...existing, ...updates }),
        default: defaultValue,
    })
}

/**
 * 最大值模式（数字） - 保留最大的值
 * 用于：分数、优先级、版本号
 * 例如：最高分、最新版本
 */
export function Max(defaultValue: () => number = () => -Infinity) {
    return Annotation<number>({
        reducer: (existing, newValue) => Math.max(existing, newValue),
        default: defaultValue,
    })
}

/**
 * 最小值模式（数字） - 保留最小的值
 * 用于：成本、时间、距离
 * 例如：最低价格、最短路径
 */
export function Min(defaultValue: () => number = () => Infinity) {
    return Annotation<number>({
        reducer: (existing, newValue) => Math.min(existing, newValue),
        default: defaultValue,
    })
}

/**
 * 去重累加模式（数组） - 追加新元素但保持唯一性
 * 用于：标签、分类、ID列表
 * 例如：用户标签、唯一标识符
 */
export function AppendUnique<T>(defaultValue: () => T[] = () => []) {
    return Annotation<T[]>({
        reducer: (existing, newItems) => {
            const combined = [...existing, ...newItems]
            return Array.from(new Set(combined))
        },
        default: defaultValue,
    })
}

/**
 * 布尔或模式 - 任意一个为 true 则为 true
 * 用于：标志位、开关状态
 * 例如：是否有错误、是否已完成
 */
export function Or(defaultValue: () => boolean = () => false) {
    return Annotation<boolean>({
        reducer: (existing, newValue) => existing || newValue,
        default: defaultValue,
    })
}

/**
 * 布尔与模式 - 所有值都为 true 才为 true
 * 用于：验证状态、条件检查
 * 例如：所有步骤是否完成
 */
export function And(defaultValue: () => boolean = () => true) {
    return Annotation<boolean>({
        reducer: (existing, newValue) => existing && newValue,
        default: defaultValue,
    })
}
