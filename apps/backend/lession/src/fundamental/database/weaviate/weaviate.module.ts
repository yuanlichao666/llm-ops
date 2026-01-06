import { Global, Module, OnModuleDestroy } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { WeaviateClient } from 'weaviate-client'

import { WEAVIATE_CLIENT, WeaviateProvider } from './weaviate.provider'

@Global()
@Module({
    providers: [WeaviateProvider],
    exports: [WeaviateProvider],
})
export class WeaviateModule implements OnModuleDestroy {
    constructor(private readonly reference: ModuleRef) {}

    async onModuleDestroy() {
        await this.reference.get<WeaviateClient>(WEAVIATE_CLIENT).close()
    }
}
