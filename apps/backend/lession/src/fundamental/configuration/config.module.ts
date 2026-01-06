import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import configLoader from './config.loader'
import { validate } from './config.validation'

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configLoader], // 加载 YAML 配置
            validate, // 验证环境变量
            isGlobal: true,
        }),
    ],
    exports: [ConfigModule],
})
export class GlobalConfigModule {}
