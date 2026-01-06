import { Global, Module } from '@nestjs/common'
import { ClsPluginTransactional } from '@nestjs-cls/transactional'
import { ClsModule } from 'nestjs-cls'

import { Neo4jModule } from '../../fundamental/database/neo4j/neo4j.module'
import { NEO4J_DRIVER } from '../../fundamental/database/neo4j/neo4j.provider'
import { TransactionalAdapterNeo4j } from './neo4j.adapter'

@Global()
@Module({
    imports: [
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [Neo4jModule], // 提供 Driver 的模块
                    adapter: new TransactionalAdapterNeo4j({
                        driverToken: NEO4J_DRIVER, // 你的 Neo4j Driver 注入令牌
                    }),
                }),
            ],
        }),
    ],
})
export class AppModule {}
