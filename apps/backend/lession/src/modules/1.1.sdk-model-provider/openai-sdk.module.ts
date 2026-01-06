import { Module } from '@nestjs/common'
import OpenAI from 'openai'

export const OpenAISDKProvider = {
    provide: 'OpenAI',
    useFactory: async () => {
        // return new OpenAI({
        //     apiKey: 'sk-nI9Gd3ZexrRy6A3guPpWWNCL458F5vYYgDu1WHk0b3oL2I2c',
        //     baseURL: 'https://api.moonshot.cn/v1',
        // })

        return new OpenAI({
            apiKey: '2f98ac95-a737-4672-bbae-ea5b3bb3a398',
            baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
        })
    },
}

@Module({
    imports: [],
    controllers: [],
    providers: [OpenAISDKProvider],
    exports: [OpenAISDKProvider],
})
export class OpenAISDKModule {}
