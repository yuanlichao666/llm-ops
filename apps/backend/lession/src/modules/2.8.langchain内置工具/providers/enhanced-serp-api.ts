import { EnhancedSerpAPI } from '../tools/enhanced-serpapi'

process.env.SERPAPI_API_KEY =
    '48e43d72f43b75c09752d03b9e518dbb4005ab67e8e7df57275d1ff848da7ba1'

export const EnhancedSerpApiProvider = {
    provide: 'SerpApi',
    useValue: new EnhancedSerpAPI(process.env.SERPAPI_API_KEY, {
        maxResults: 5, // 返回前5个搜索结果
    }),
}
