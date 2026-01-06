import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf'
import { ConfigService } from '@nestjs/config'

import { YamlConfig } from '../configuration/config.validation'

export const HUGGINGFACE_EMBEDDING_MODEL_GOOGLE = Symbol(
    'HuggingFaceEmbeddingModel_Google'
)

export const HuggingFaceEmbeddingModel_Google = {
    provide: HUGGINGFACE_EMBEDDING_MODEL_GOOGLE,
    useFactory: (configService: ConfigService<YamlConfig>) => {
        const config = configService.get(
            'chat_models.huggingface_google_embedding',
            {
                infer: true,
            }
        )!
        return new HuggingFaceInferenceEmbeddings({
            apiKey: config.api_key,
            model: config.model,
            provider: config.provider as 'hf-inference',
        })
    },
    inject: ['ConfigService'],
}
