import { Global, Module } from '@nestjs/common'

import { DoubaoEmbeddingModel, DoubaoProModel, DoubaoSeedModel } from './doubao'
import { HuggingFaceEmbeddingModel_Google } from './huggingface'
import { KimiThinkingModel, KimiTurboModel } from './kimi'

@Global()
@Module({
    imports: [],
    controllers: [],
    providers: [
        KimiTurboModel,
        KimiThinkingModel,
        DoubaoProModel,
        DoubaoSeedModel,
        DoubaoEmbeddingModel,
        HuggingFaceEmbeddingModel_Google,
    ],
    exports: [
        KimiTurboModel,
        KimiThinkingModel,
        DoubaoProModel,
        DoubaoSeedModel,
        DoubaoEmbeddingModel,
        HuggingFaceEmbeddingModel_Google,
    ],
})
export class LLMModule {}
