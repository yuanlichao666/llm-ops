import { SerpAPI } from '@langchain/community/tools/serpapi'

process.env.SERPAPI_API_KEY =
    '48e43d72f43b75c09752d03b9e518dbb4005ab67e8e7df57275d1ff848da7ba1'

export const SerpApiProvider = {
    provide: 'SerpApi',
    useValue: new SerpAPI(),
}
