import { EnsembleRetriever } from '@langchain/classic/retrievers/ensemble'
import { BM25Retriever } from '@langchain/community/retrievers/bm25'
// import { Document } from '@langchain/core/documents'
import { VectorStore } from '@langchain/core/vectorstores'
/**
 * FAISS 本身不支持根据 ID 去重 - 它只是简单地追加向量，不会检查是否已存在
 * 如果解开下面的注释会导致每次重启服务都重复添加文档
 */
const documents = [
    // new Document({
    //     pageContent: '笨笨是一只很喜欢睡觉的猫咪',
    //     metadata: { page: 1 },
    // }),
    // new Document({
    //     pageContent: '我喜欢在夜晚听音乐，这让我感到放松。',
    //     metadata: { page: 2 },
    // }),
    // new Document({
    //     pageContent: '猫咪在窗台上打盹，看起来非常可爱。',
    //     metadata: { page: 3 },
    // }),
    // new Document({
    //     pageContent: '学习新技能是每个人都应该追求的目标。',
    //     metadata: { page: 4 },
    // }),
    // new Document({
    //     pageContent: '我最喜欢的食物是意大利面，尤其是番茄酱的那种。',
    //     metadata: { page: 5 },
    // }),
    // new Document({
    //     pageContent: '昨晚我做了一个奇怪的梦，梦见自己在太空飞行。',
    //     metadata: { page: 6 },
    // }),
    // new Document({
    //     pageContent: '我的手机突然关机了，让我有些焦虑。',
    //     metadata: { page: 7 },
    // }),
    // new Document({
    //     pageContent: '阅读是我每天都会做的事情，我觉得很充实。',
    //     metadata: { page: 8 },
    // }),
    // new Document({
    //     pageContent: '他们一起计划了一次周末的野餐，希望天气能好。',
    //     metadata: { page: 9 },
    // }),
    // new Document({
    //     pageContent: '我的狗喜欢追逐球，看起来非常开心。',
    //     metadata: { page: 10 },
    // }),
]

export const EnsembleRetrieverProvider = {
    provide: 'EnsembleRetriever',
    useFactory: async (faissStore: VectorStore) => {
        await faissStore.addDocuments(documents)
        const bm25Retriever = BM25Retriever.fromDocuments(documents, { k: 4 })
        const faissRetriever = faissStore.asRetriever({ k: 4 })
        return new EnsembleRetriever({
            retrievers: [faissRetriever, bm25Retriever],
            weights: [0.5, 0.5],
            c: 60,
        })
    },
    inject: ['FaissStore'],
}
