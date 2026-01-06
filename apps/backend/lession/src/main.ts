import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { YamlConfig } from './fundamental/configuration/config.validation'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    // 获取 ConfigService 实例
    const configService = app.get(ConfigService<YamlConfig>)

    // 从配置文件读取端口号，支持环境变量覆盖
    const port = configService.get('http.port', { infer: true }) ?? 3000
    const host = configService.get('http.host', { infer: true }) ?? 'localhost'

    await app.listen(port, host)

    // eslint-disable-next-line no-console
    console.log(`🚀 应用已启动: http://${host}:${port}`)
}

bootstrap()
