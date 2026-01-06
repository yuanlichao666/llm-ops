import {
    Runnable,
    RunnableAssign,
    RunnableConfig,
    RunnableEach,
    RunnableLambda,
    RunnableLike,
    RunnableMap,
} from '@langchain/core/runnables'

export const value = <T>(value: T) => RunnableLambda.from(() => value)

export const lambda = RunnableLambda.from

type RunnableMapLike<RunInput, RunOutput> = {
    [K in keyof RunOutput]: RunnableLike<RunInput, RunOutput[K]>
}

export const map = <T, R extends Record<string, any>>(
    output: RunnableMapLike<T, R>
) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return RunnableLambda.from<T, R>((input: T) => {
        return RunnableMap.from<T, R>(output)
    })
}

// export const assign = RunnablePassthrough.assign

export const assign = (input: any) => new RunnableAssign(input)

export const pick = <T>(key: keyof T) => {
    return RunnableLambda.from<T, T[keyof T]>(async (input: T) => {
        return input[key]
    })
}

// 使用时需要手动传递泛型
export const pass = <T>() => {
    return RunnableLambda.from<T, T>((input: T) => input) as Runnable<T, T>
}

// 重载签名
export function set<T extends object>(
    fn: (input: T) => object
): RunnableLambda<T, T>

export function set<T extends object>(
    key: string,
    value: any
): RunnableLambda<T, T>

export function set<T extends object>(
    key: string,
    pick: string
): RunnableLambda<T, T>

// 实现
export function set<T extends object>(
    fnOrKey: ((input: T) => object) | string,
    value?: any
) {
    if (typeof fnOrKey === 'function') {
        return RunnableLambda.from(async (input: T) => ({
            ...input,
            ...fnOrKey(input),
        }))
    } else if (typeof fnOrKey === 'string') {
        return RunnableLambda.from(async (input: T) => ({
            ...input,
            [fnOrKey]: pick(value as keyof T),
        }))
    } else {
        return RunnableLambda.from(async (input: T) => ({
            ...input,
            [fnOrKey]: value,
        }))
    }
}

/**
 * tap(x => void)
 */
export function tap<T>(sideEffect: (value: T) => void | Promise<void>) {
    return RunnableLambda.from<T, T>(async (input: T) => {
        await sideEffect(input)
        return input
    })
}

/**
 * filter(x => boolean)
 * 不满足时抛错（你也可以返回 undefined 表示跳过）
 */
export function filter<T>(predicate: (value: T) => boolean) {
    return RunnableLambda.from<T, T>(async (input: T) => {
        if (!predicate(input)) {
            throw new Error('Filtered out by operator')
        }
        return input
    })
}

/**
 * delay(ms)
 */
export function delay<T>(ms: number) {
    return RunnableLambda.from<T, T>(async (input: T) => {
        await new Promise(res => setTimeout(res, ms))
        return input
    })
}

/**
 * 并发执行（可选 concurrency）
 */

export function parallel<T, R>(
    runnable: Runnable<T, R>,
    maxConcurrency = Infinity
): Runnable<T[], R[]> {
    // <-- 修复了这里的返回类型
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return RunnableLambda.from((input: T[]) => {
        // <-- 修复了回调函数的返回类型
        // RunnableEach 接受 T[] 并返回 R[]
        return new RunnableEach<T, R, RunnableConfig<Record<string, any>>>({
            bound: runnable,
        }).withConfig({ maxConcurrency })
    })
}

/**
 * 串行执行
 */
export function serial<T, R>(
    runnable: Runnable<T, R, RunnableConfig<Record<string, any>>>
): Runnable<T[], R[]> {
    return new RunnableEach({
        bound: runnable,
    }).withConfig({ maxConcurrency: 1 })
}

/**
 * switchMap()
 * 最后一次才有效
 */
export function switchMap<T, R>(project: (value: T) => Promise<R>) {
    let last = 0
    return RunnableLambda.from<T, R>(async (input: T) => {
        const id = ++last
        const result = await project(input)
        if (id !== last) {
            throw new Error('switchMap canceled previous request')
        }
        return result
    }).withConfig({ runName: 'SwitchMap' })
}

/**
 * catchError
 */
export function catchError<T>(handler: (err: any, value: T) => T | Promise<T>) {
    return RunnableLambda.from<T, T>(async (input: T) => {
        try {
            return input
        } catch (err) {
            return handler(err, input)
        }
    })
}

/**
 * debounce(ms)
 */
export function debounce<T>(ms: number) {
    let timer: any = null
    let resolvers: ((value: T) => void)[] = []
    return RunnableLambda.from<T, T>(async (input: T) => {
        if (timer) clearTimeout(timer)

        return await new Promise<T>(resolve => {
            resolvers.push(resolve)
            timer = setTimeout(() => {
                const value = input
                resolvers.forEach(r => r(value))
                resolvers = []
            }, ms)
        })
    })
}

/**
 * throttle(ms)
 */
export function throttle<T>(ms: number) {
    let lastTime = 0
    return RunnableLambda.from<T, T>(async (input: T) => {
        const now = Date.now()
        if (now - lastTime > ms) {
            lastTime = now
        }
        return input
    })
}

/**
 * take(n)
 */
export function take<T>(n: number) {
    let count = 0
    return RunnableLambda.from<T, T>(async (input: T) => {
        if (count++ >= n) {
            throw new Error('take: exceeded')
        }
        return input
    })
}

/**
 * scan(accFn, seed)
 */
export function scan<T, R>(accFn: (acc: R, value: T) => R, seed: R) {
    let acc = seed
    return RunnableLambda.from<T, R>(async (input: T) => {
        acc = accFn(acc, input)
        return acc
    })
}
