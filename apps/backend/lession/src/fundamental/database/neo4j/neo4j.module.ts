import { Module, OnModuleDestroy } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { Driver } from 'neo4j-driver'

import { NEO4J_DRIVER, Neo4jProvider } from './neo4j.provider'

@Module({
    providers: [Neo4jProvider],
    exports: [Neo4jProvider],
})
export class Neo4jModule implements OnModuleDestroy {
    constructor(private readonly moduleRef: ModuleRef) {}

    async onModuleDestroy() {
        try {
            const driver = this.moduleRef.get<Driver>(NEO4J_DRIVER, {
                strict: false,
            })

            if (driver) {
                // eslint-disable-next-line no-console
                console.log('⏳ 正在关闭 Neo4j 连接...')
                await driver.close()
                // eslint-disable-next-line no-console
                console.log('✓ Neo4j 连接已关闭')
            }
        } catch {
            // Driver 可能还没有初始化就被销毁了
            // eslint-disable-next-line no-console
            console.log('Neo4j driver 未找到或已关闭')
        }
    }
}
