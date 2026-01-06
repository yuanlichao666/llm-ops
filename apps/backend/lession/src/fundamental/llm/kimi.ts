import { ChatOpenAI } from '@langchain/openai'
import { ConfigService } from '@nestjs/config'

import { YamlConfig } from '../configuration/config.validation'

export const KimiTurboModel = {
    provide: 'KimiTurboModel',
    useFactory: (configService: ConfigService<YamlConfig>) => {
        const config = configService.get('chat_models.kimi_turbo', {
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

export const KimiThinkingModel = {
    provide: 'KimiThinkingModel',
    useFactory: (configService: ConfigService<YamlConfig>) => {
        const config = configService.get('chat_models.kimi_thinking', {
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
