import { Global, Module } from '@nestjs/common'

import { Neo4jModule } from './neo4j/neo4j.module'
import { WeaviateModule } from './weaviate/weaviate.module'

@Global()
@Module({
    imports: [Neo4jModule, WeaviateModule],
    exports: [Neo4jModule, WeaviateModule],
})
export class DatabaseModule {}
