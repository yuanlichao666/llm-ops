import { plainToInstance, Type } from 'class-transformer'
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsString,
    IsUrl,
    Max,
    Min,
    ValidateNested,
    validateSync,
} from 'class-validator'

// HTTP 配置
export class HttpConfig {
    @IsString()
    @IsNotEmpty()
    host: string

    @IsNumber()
    @Min(0)
    @Max(65535)
    port: number
}

// Proxy 配置
export class ProxyConfig {
    @IsBoolean()
    enabled: boolean

    @IsString()
    @IsNotEmpty()
    url: string
}

// LangSmith 配置
export class LangSmithConfig {
    @IsBoolean()
    tracing: boolean

    @IsString()
    @IsNotEmpty()
    api_key: string
}

// 聊天模型单个配置
export class ChatModelConfig {
    @IsString()
    @IsNotEmpty()
    api_key: string

    @IsString()
    @IsNotEmpty()
    model: string

    @IsUrl({ require_tld: false })
    @IsNotEmpty()
    base_url: string
}

// HuggingFace Embedding模型配置
export class HuggingFaceEmbeddingsConfig {
    @IsString()
    @IsNotEmpty()
    api_key: string

    @IsString()
    @IsNotEmpty()
    model: string

    @IsString()
    @IsNotEmpty()
    provider: string
}

// 聊天模型配置集合
export class ChatModelsConfig {
    @ValidateNested()
    @Type(() => ChatModelConfig)
    doubao_pro: ChatModelConfig

    @ValidateNested()
    @Type(() => ChatModelConfig)
    doubao_seed: ChatModelConfig

    @ValidateNested()
    @Type(() => ChatModelConfig)
    kimi_turbo: ChatModelConfig

    @ValidateNested()
    @Type(() => ChatModelConfig)
    kimi_thinking: ChatModelConfig

    @ValidateNested()
    @Type(() => ChatModelConfig)
    doubao_embedding: ChatModelConfig

    @ValidateNested()
    @Type(() => HuggingFaceEmbeddingsConfig)
    huggingface_google_embedding: HuggingFaceEmbeddingsConfig
}

//Neo4j配置
export class Neo4jConfig {
    @IsString()
    @IsNotEmpty()
    uri: string

    @IsString()
    @IsNotEmpty()
    username: string

    @IsString()
    @IsNotEmpty()
    password: string
}

//Weaviate配置
export class WeaviateConfig {
    @IsString()
    @IsNotEmpty()
    url: string

    @IsNumber()
    @Min(0)
    @Max(65535)
    port: number

    @IsString()
    @IsNotEmpty()
    auth_credentials: string

    @IsString()
    @IsNotEmpty()
    index_name: string
}

// PostgreSQL 配置
export class PostgresConfig {
    @IsString()
    @IsNotEmpty()
    url: string

    @IsNumber()
    @Min(0)
    @Max(65535)
    port: number

    @IsString()
    @IsNotEmpty()
    database: string
}

// SQLite 配置
export class SqliteConfig {
    @IsString()
    @IsNotEmpty()
    database: string
}

// 数据库配置
export class DbConfig {
    @ValidateNested()
    @Type(() => PostgresConfig)
    postgres: PostgresConfig

    @ValidateNested()
    @Type(() => SqliteConfig)
    sqlite: SqliteConfig

    @ValidateNested()
    @Type(() => WeaviateConfig)
    weaviate: WeaviateConfig

    @ValidateNested()
    @Type(() => Neo4jConfig)
    neo4j: Neo4jConfig
}

// YAML 配置文件结构
export class YamlConfig {
    @ValidateNested()
    @Type(() => HttpConfig)
    http: HttpConfig

    @ValidateNested()
    @Type(() => ProxyConfig)
    proxy: ProxyConfig

    @ValidateNested()
    @Type(() => LangSmithConfig)
    langsmith: LangSmithConfig

    @ValidateNested()
    @Type(() => ChatModelsConfig)
    chat_models: ChatModelsConfig

    @ValidateNested()
    @Type(() => DbConfig)
    db: DbConfig
}

// 验证环境变量
export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(YamlConfig, config, {
        enableImplicitConversion: true,
    })
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    })

    if (errors.length > 0) {
        throw new Error(errors.toString())
    }
    return validatedConfig
}
