import { ByteDanceDoubaoEmbeddings } from '@langchain/community/embeddings/bytedance_doubao'
// @ts-expect-error 修复ByteDanceDoubaoEmbeddings的embeddingWithRetry方法
ByteDanceDoubaoEmbeddings.prototype.embeddingWithRetry! = function (body: any) {
    // 1.输入格式变化：原来的api只支持文本输入，现在支持多模态输入
    const multimodalInput = body.input.map(text => ({ type: 'text', text }))
    return fetch(
        'https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                ...body,
                input: multimodalInput,
            }),
        }
    ).then(async response => {
        const embeddingData = await response.json()

        if ('code' in embeddingData && embeddingData.code) {
            throw new Error(`${embeddingData.code}: ${embeddingData.message}`)
        }
        // 2.输出格式变化：原来的api返回的是一个对象数组，现在返回的是一个数组
        return [embeddingData.data.embedding]
    })
}
