import { Module } from '@nestjs/common'

import { SetupService } from './setup.service'
// 副作用module，设置全局的一些环境变量、启动项
@Module({
    imports: [],
    controllers: [],
    providers: [SetupService],
})
export class SetupModule {}
