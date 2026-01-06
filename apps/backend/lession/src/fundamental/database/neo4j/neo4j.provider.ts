import { ConfigService } from '@nestjs/config'
import neo4j from 'neo4j-driver'

import { YamlConfig } from '../../configuration/config.validation'

// 使用 Symbol 确保令牌唯一性（推荐）
export const NEO4J_DRIVER = 'NEO4J_DRIVER'

export const Neo4jProvider = {
    provide: NEO4J_DRIVER,
    useFactory: async (configService: ConfigService<YamlConfig>) => {
        const neo4jConfig = configService.get('db.neo4j', { infer: true })!
        const { uri, username, password } = neo4jConfig

        const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))

        // 验证连接
        try {
            await driver.verifyConnectivity()
            // eslint-disable-next-line no-console
            console.log('✓ Neo4j 数据库连接成功')
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('✗ Neo4j 数据库连接失败:', error)
            throw error
        }

        return driver
    },
    inject: [ConfigService],
}
