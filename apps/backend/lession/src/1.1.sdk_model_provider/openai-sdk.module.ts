import { Module } from '@nestjs/common'
import OpenAI from 'openai'

export const OpenAISDKProvider = {
  provide: 'OpenAI',
  useFactory: async () => {
    return new OpenAI({
      apiKey: 'sk-nI9Gd3ZexrRy6A3guPpWWNCL458F5vYYgDu1WHk0b3oL2I2c',
      baseURL: 'https://api.moonshot.cn/v1',
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
