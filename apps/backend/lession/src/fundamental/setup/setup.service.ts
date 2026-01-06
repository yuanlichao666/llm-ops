// src/fundamental/configuration/global-setup.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ProxyAgent, setGlobalDispatcher } from 'undici'

import { YamlConfig } from '../configuration/config.validation'

@Injectable()
export class SetupService implements OnModuleInit {
    constructor(private configService: ConfigService<YamlConfig>) {}

    onModuleInit() {
        this.setupProxy()
        this.setupLangSmith()
    }

    private setupProxy() {
        const proxyConfig = this.configService.get('proxy', {
            infer: true,
        })!

        if (proxyConfig.enabled) {
            const dispatcher = new ProxyAgent(proxyConfig.url)
            setGlobalDispatcher(dispatcher)
            // eslint-disable-next-line no-console
            console.log(`✓ 全局代理已设置: ${proxyConfig.url}`)
        }
    }

    private setupLangSmith() {
        const langSmithConfig = this.configService.get('langsmith', {
            infer: true,
        })!

        if (langSmithConfig.tracing) {
            process.env.LANGSMITH_TRACING = 'true'
            process.env.LANGSMITH_API_KEY = langSmithConfig.api_key
            // eslint-disable-next-line no-console
            console.log('✓ LangSmith 追踪已启用')
        }
    }
}
