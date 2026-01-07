import {
    TransactionalAdapter,
    TransactionalAdapterOptions,
} from '@nestjs-cls/transactional'
import { Driver, Transaction } from 'neo4j-driver'
import { Integer } from 'neo4j-driver'

type NumberOrInteger = number | Integer | bigint

export interface TransactionConfig {
    timeout?: NumberOrInteger
    metadata?: object
}

export interface Neo4jRuntime {
    run: Transaction['run']
}

export class TransactionalAdapterNeo4j implements TransactionalAdapter<
    Driver,
    Neo4jRuntime,
    TransactionConfig
> {
    // 注入 Driver 的 Token
    connectionToken: any
    defaultTxOptions?: Partial<TransactionConfig>

    constructor(options: {
        driverToken: any
        defaultOptions?: TransactionConfig
    }) {
        this.connectionToken = options.driverToken
        this.defaultTxOptions = options.defaultOptions
    }

    optionsFactory(
        driver: Driver
    ): TransactionalAdapterOptions<Neo4jRuntime, TransactionConfig> {
        return {
            // 核心：如何包裹事务
            wrapWithTransaction: async (options, fn, setTx) => {
                const session = driver.session()
                const tx = session.beginTransaction(options)
                try {
                    // 将事务实例存入 CLS
                    setTx(tx)
                    const result = await fn()
                    await tx.commit()
                    return result
                } catch (error) {
                    await tx.rollback()
                    throw error
                } finally {
                    await session.close()
                }
            },

            // 备用实例：在非 @Transactional 上下文中使用时，我们返回一个 Neo4jRuntime 实例
            // 这样repo中无差别获取tx就行了 Neo4jRuntime自动管理session
            getFallbackInstance: () =>
                ({
                    run: async (cypher: string, params?: any) => {
                        const session = driver.session()
                        try {
                            return await session.run(cypher, params)
                        } finally {
                            // 关键：非事务模式下，执行完立即关闭 session，释放连接池
                            await session.close()
                        }
                    },
                }) as Neo4jRuntime,
        }
    }
}
