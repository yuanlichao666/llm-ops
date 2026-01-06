import '../../../helpers/doubao-embeddings-fixed'

import { ByteDanceDoubaoEmbeddings } from '@langchain/community/embeddings/bytedance_doubao'
import { ChatOpenAI } from '@langchain/openai'
import { ConfigService } from '@nestjs/config'

import { YamlConfig } from '../configuration/config.validation'

export const DOUBAO_PRO_MODEL = Symbol('DoubaoProModel')

//DoubaoProModel 支持工具调用，但不支持结构化输出
export const DoubaoProModel = {
    provide: DOUBAO_PRO_MODEL,
    useFactory: (configService: ConfigService<YamlConfig>) => {
        const config = configService.get('chat_models.doubao_pro', {
            infer: true,
        })!
        return new ChatOpenAI({
            apiKey: config.api_key,
            model: config.model,
            configuration: {
                baseURL: config.base_url,
            },
        })
    },
    inject: ['ConfigService'],
}

export const DOUBAO_SEED_MODEL = Symbol('DoubaoSeedModel')
//DoubaoSeedModel 支持工具调用，支持结构化输出
export const DoubaoSeedModel = {
    provide: DOUBAO_SEED_MODEL,
    useFactory: (configService: ConfigService<YamlConfig>) => {
        const config = configService.get('chat_models.doubao_seed', {
            infer: true,
        })!
        return new ChatOpenAI({
            apiKey: config.api_key,
            model: config.model,
            configuration: {
                baseURL: config.base_url,
            },
        })
    },
}

export const DoubaoEmbeddingModel = {
    provide: 'DoubaoEmbeddingModel',
    useFactory: (configService: ConfigService<YamlConfig>) => {
        const config = configService.get('chat_models.doubao_embedding', {
            infer: true,
        })!
        return new ByteDanceDoubaoEmbeddings({
            apiKey: config.api_key,
            model: config.model,
        })
    },
    inject: ['ConfigService'],
}
