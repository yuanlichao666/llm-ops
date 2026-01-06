import { ConfigService } from '@nestjs/config'
import weaviate from 'weaviate-client'

import { YamlConfig } from '../../configuration/config.validation'

export const WEAVIATE_CLIENT = Symbol('WEAVIATE_CLIENT')

export const WeaviateProvider = {
    provide: WEAVIATE_CLIENT,
    useFactory: async (configService: ConfigService<YamlConfig>) => {
        const weaviateConfig = configService.get('db.weaviate', {
            infer: true,
        })!
        const { url, port, auth_credentials } = weaviateConfig
        return await weaviate.connectToLocal({
            host: url,
            port,
            authCredentials: new weaviate.ApiKey(auth_credentials),
        })
    },
    inject: [ConfigService],
}
