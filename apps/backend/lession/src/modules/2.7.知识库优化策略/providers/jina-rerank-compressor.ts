import { JinaRerankCompressor } from '../reranker/jina-rerank-compressor'

export const JinaRerankCompressorProvider = {
    provide: 'JinaRerankCompressor',
    useFactory: () => {
        return new JinaRerankCompressor({
            apiKey: 'jina_61ce2c2ee4414a60b5647d33734da16e1IMZ3ren8r3mcjWb8uM0IAyDc8f3',
            model: 'jina-reranker-v3',
            topN: 5,
            scoreThreshold: 0,
        })
    },
}
