# LangChain.js 文本生成图片工具统计

根据对 LangChain.js 源码和文档的调研，以下是 LangChain.js 中支持文本生成图片的工具清单：

## 1. OpenAI Image Generation Tool (内置工具)

**包名：** `@langchain/openai`

**工具类型：** 内置工具（Built-in tool）

**说明：** OpenAI 提供的内置图片生成工具，通过 GPT Image 模型实现文本生成图片功能。

**主要特性：**

- ✅ 文本生成图片：根据文本描述生成图片
- ✅ 图片编辑：基于文本指令修改现有图片
- ✅ 多轮图片编辑：支持对话中迭代优化图片
- ✅ 多种输出格式：支持 PNG、JPEG、WebP 格式
- ✅ 自定义尺寸和质量：可配置输出尺寸和质量级别
- ✅ 透明背景：支持生成透明背景图片
- ✅ 流式输出：支持部分图片的流式反馈（partial images）

**使用方式：**

### 方式一：通过 `tools.imageGeneration()`

```typescript
import { ChatOpenAI, tools } from '@langchain/openai'

const model = new ChatOpenAI({ model: 'gpt-4o' })

const response = await model.invoke(
    'Generate an image of a gray tabby cat hugging an otter with an orange scarf',
    { tools: [tools.imageGeneration()] }
)

// 获取生成的图片（base64编码）
const imageOutput = response.additional_kwargs.tool_outputs?.find(
    output => output.type === 'image_generation_call'
)
if (imageOutput?.result) {
    const fs = await import('fs')
    fs.writeFileSync('output.png', Buffer.from(imageOutput.result, 'base64'))
}
```

### 方式二：通过 `bindTools()` 方法（使用 Responses API）

```typescript
import { ChatOpenAI } from '@langchain/openai'

const llm = new ChatOpenAI({
    model: 'gpt-4.1',
    useResponsesApi: true,
})

const llmWithImageGeneration = llm.bindTools([
    {
        type: 'image_generation',
        quality: 'low',
    },
])

const response = await llmWithImageGeneration.invoke(
    'Draw a random short word in green font.'
)
```

**配置选项：**

- `size`: 图片尺寸（"1024x1024", "1024x1536", "1536x1024", "auto"）
- `quality`: 质量级别（"low", "medium", "high", "auto"）
- `outputFormat`: 输出格式（"png", "jpeg", "webp"）
- `outputCompression`: 压缩级别（0-100，用于 JPEG/WebP）
- `background`: 背景类型（"transparent", "opaque", "auto"）
- `partialImages`: 部分图片数量（0-3）
- `tool_choice`: 强制使用图片生成工具

**工作原理说明：**

这是一个**内置工具（Built-in Tool）**，采用两层架构：

1. **工具调用层**：GPT 模型（如 `gpt-4o`、`gpt-4.1` 等）接收用户请求，识别需要生成图片，然后调用图片生成工具
2. **图片生成层**：工具内部调用 **GPT Image 模型** 来实际生成图片

**关键点：**

- ✅ 不是直接调用传统的 DALL-E API（`images.create`）
- ✅ 是通过 GPT 模型的工具调用机制，调用底层的 **GPT Image 模型**
- ✅ 工具会**自动优化文本输入**以提高性能（文档中提到："automatically optimizes text inputs for improved performance"）
- ✅ 工具规范了参数接口，让开发者可以方便地配置图片生成的各种选项
- ✅ 支持多轮对话中的图片编辑，这是传统 DALL-E API 不具备的能力

**与直接调用 DALL-E API 的区别：**

- 传统方式：开发者直接调用 `openai.images.create()`，自己处理参数和响应
- 工具方式：通过 GPT 模型的工具调用机制，模型智能决定何时使用图片生成，并自动优化提示词，同时规范了参数接口

**支持的模型：**

- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4.1`
- `gpt-4.1-mini`
- `gpt-4.1-nano`
- `o3`

**文档链接：**

- [Image Generation Tool 文档](https://docs.langchain.com/oss/javascript/integrations/tools/openai)
- [ChatOpenAI Image Generation 文档](https://docs.langchain.com/oss/javascript/integrations/chat/openai)

---

## 2. DALL-E Tool (社区工具)

**包名：** `@langchain/community`

**工具类型：** 社区集成工具

**说明：** LangChain Community 包中提供的 DALL-E 图片生成工具，使用 OpenAI 的 DALL-E 模型进行文本到图片的生成。

**文档链接：**

- [All Tools and Toolkits](https://docs.langchain.com/oss/javascript/integrations/tools/index) - 在工具列表中明确列出 "Dall-E Tool"

**注意：** 此工具在官方文档的工具列表中列出，但具体的使用文档和示例需要进一步查看 `@langchain/community` 包的详细文档。

---

## 3. Python 版本的 DALL-E Image Generator

**包名：** `langchain-community` (Python)

**说明：** 虽然这是 Python 版本，但可作为参考。Python 版本的 LangChain 明确提供了 `Dall-E Image Generator` 工具，用于文本到图片生成。

**文档链接：**

- [OpenAI Tools and Toolkits (Python)](https://docs.langchain.com/oss/python/integrations/providers/openai)

---

## 总结

### JavaScript/TypeScript 版本

1. **OpenAI Image Generation Tool** - 官方内置工具，功能最全面，推荐使用
    - 包：`@langchain/openai`
    - 类型：内置工具（Built-in tool）
    - 状态：✅ 官方支持，文档完善

2. **DALL-E Tool** - 社区工具
    - 包：`@langchain/community`
    - 类型：社区集成工具
    - 状态：✅ 在工具列表中列出，具体实现需查看源码

### 建议

- **优先使用 OpenAI Image Generation Tool**：这是官方内置工具，功能最全面，文档完善，支持多种高级功能（图片编辑、多轮对话、流式输出等）
- **备选 DALL-E Tool**：如果需要更底层的 DALL-E API 控制，可以使用社区版的 DALL-E Tool

### 版本要求

- `@langchain/openai` >= 1.2.0（支持内置工具功能）
- `@langchain/core` >= 0.1.48（支持生成元数据）

---

## 参考资料

1. [LangChain.js Tools 文档](https://docs.langchain.com/oss/javascript/langchain/tools)
2. [OpenAI Image Generation Tool 文档](https://docs.langchain.com/oss/javascript/integrations/tools/openai)
3. [ChatOpenAI Image Generation 文档](https://docs.langchain.com/oss/javascript/integrations/chat/openai)
4. [All Tools and Toolkits](https://docs.langchain.com/oss/javascript/integrations/tools/index)
5. [LangChain.js Changelog](https://docs.langchain.com/oss/javascript/releases/changelog)
