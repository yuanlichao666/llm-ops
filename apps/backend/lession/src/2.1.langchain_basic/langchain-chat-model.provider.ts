import { ChatMoonshot } from '@langchain/community/chat_models/moonshot'

export function ChatModelFactory() {
  return new ChatMoonshot({
    apiKey: 'sk-nI9Gd3ZexrRy6A3guPpWWNCL458F5vYYgDu1WHk0b3oL2I2c', // In Node.js defaults to process.env.MOONSHOT_API_KEY
    model: 'kimi-k2-turbo-preview', // Available models: moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k
    temperature: 0.3,
  })
}

export const ChatModelProvider = {
  provide: 'ChatModel',
  useFactory: ChatModelFactory,
}
