import { Controller } from '@nestjs/common'

import { GraphRagService } from './graph-rag.service'

@Controller('langchain/rag/graph-rag')
export class GraphRagController {
    constructor(private readonly graphRagService: GraphRagService) {}
}
