# 增强版 SerpAPI 工具使用说明

## 问题背景

LangChain 官方提供的 `SerpAPI` 工具存在以下问题：

### 1. **只返回第一个搜索结果**

源码中只取 `organic_results[0]`，导致信息不完整：

```typescript
// 官方实现（简化）
const first_organic_result = res.organic_results?.[0]
if (first_organic_result) {
    if (first_organic_result.snippet)
        snippets.push(first_organic_result.snippet)
}
```

### 2. **只返回摘要片段（snippet）**

只返回搜索结果的摘要，不包含标题、链接等完整信息

### 3. **信息经常被截断**

返回的 snippet 本身就是片段，常常不完整

## 解决方案

`EnhancedSerpAPI` 增强版工具主要改进：

### ✅ 返回多个搜索结果

默认返回前 5 个结果，可配置数量

### ✅ 返回完整信息

包含：标题、摘要、链接、日期等

### ✅ 支持多种搜索结果类型

- 直接答案框（Answer Box）
- 知识图谱（Knowledge Graph）
- 新闻结果（News Results）
- 体育赛事（Sports Results）
- 常规搜索结果（Organic Results）

### ✅ 优化的中文搜索

- 设置地区为中国（`gl: 'cn'`）
- 语言设置为简体中文（`hl: 'zh-cn'`）

## 使用方法

### 1. 基本使用

```typescript
import { EnhancedSerpAPI } from '../2.8.langchain内置工具/tools/enhanced-serpapi'

// 创建工具实例
const searchTool = new EnhancedSerpAPI(process.env.SERPAPI_API_KEY, {
    maxResults: 5, // 返回前5个结果（可选，默认5）
})

// 直接调用
const result = await searchTool._call('2025年北京半程马拉松的前3名成绩')
console.log(result)
```

### 2. 在 Agent 中使用

#### 方式一：使用 Tool Calling Agent

```typescript
import { createToolCallingAgent } from '@langchain/classic/agents'
import { EnhancedSerpAPI } from '../2.8.langchain内置工具/tools/enhanced-serpapi'

const enhancedSerpApi = new EnhancedSerpAPI()

const agent = await createToolCallingAgent({
    llm: chatModel,
    tools: [enhancedSerpApi, otherTools],
    prompt,
})
```

#### 方式二：使用 LangGraph（推荐）

```typescript
async langGraphWithEnhancedTools(message: string) {
    const chatModel = this.chatModel.bindTools!([
        this.enhancedSerpApi,  // 使用增强版
        gaoDeWeather,
    ])

    const llmNode = async (state: typeof MessagesAnnotation.State) => {
        const response = await chatModel.invoke(state.messages)
        return { messages: [response] }
    }

    const toolsNode = async (state: typeof MessagesAnnotation.State) => {
        const toolsExecuter = createToolExecuter([
            this.enhancedSerpApi,  // 使用增强版
            gaoDeWeather,
        ])
        const aiMessage = state.messages.at(-1)
        const results = await toolsExecuter(aiMessage as AIMessage)
        return { messages: results.map(mapToMessages) }
    }

    // ... 其他节点和边的配置
}
```

### 3. 在模块中注册（NestJS）

```typescript
// enhanced-serp-api.ts
import { EnhancedSerpAPI } from '../tools/enhanced-serpapi'

export const EnhancedSerpApiProvider = {
    provide: 'EnhancedSerpApi',
    useValue: new EnhancedSerpAPI(process.env.SERPAPI_API_KEY, {
        maxResults: 5,
    }),
}
```

```typescript
// module.ts
import { EnhancedSerpApiProvider } from './providers/enhanced-serp-api'

@Module({
    providers: [EnhancedSerpApiProvider],
    exports: [EnhancedSerpApiProvider],
})
export class YourModule {}
```

## 返回格式对比

### 官方 SerpAPI（问题示例）

搜索："2025年北京半程马拉松的前3名成绩"

```json
[
    "同时，女子马拉松前三名均破赛会纪录。 在半程马拉松项目中，中国选手向新鹏以1小时9分10秒成绩摘得男子半马桂冠；埃塞俄比亚选手BELAY DEMAM ABEBA W以1小 ..."
]
```

❌ 只有一个结果  
❌ 信息被截断  
❌ 缺少标题和来源

### 增强版 SerpAPI

同样的搜索，返回：

```
【搜索结果（共10条，显示前5条）】

1. 2025北京半程马拉松成绩公布：向新鹏夺冠
   中国选手向新鹏以1小时9分10秒的成绩夺得男子半程马拉松冠军，这是他个人最好成绩。亚军由埃塞俄比亚选手获得，成绩为1小时9分25秒。季军同样来自埃塞俄比亚，成绩1小时9分30秒。
   链接: https://example.com/beijing-half-marathon-2025

2. 北京半马2025：三大看点全解析
   2025北京半程马拉松于4月13日举行，共有2万名选手参赛...
   链接: https://example.com/beijing-half-analysis

3. 2025北京半马女子组：埃塞俄比亚包揽前三
   女子半马方面，埃塞俄比亚选手包揽前三名，冠军成绩为1小时6分48秒...
   链接: https://example.com/women-results

4. 北京半马创纪录：多项赛会纪录被刷新
   2025年北京半程马拉松多项赛会纪录被打破...
   链接: https://example.com/records

5. 半马精英：2025北京站完整成绩单
   查看完整的2025北京半程马拉松成绩排名...
   链接: https://example.com/full-results
```

✅ 返回 5 个相关结果  
✅ 信息完整  
✅ 包含标题、摘要、链接

## 配置选项

```typescript
new EnhancedSerpAPI(apiKey, {
    maxResults: 10, // 返回结果数量（默认5，建议5-10）
    baseUrl: 'https://serpapi.com', // API 基础URL（可选）
})
```

## 注意事项

1. **API Key 必须设置**
    - 通过构造函数传入
    - 或设置环境变量 `SERPAPI_API_KEY`

2. **结果数量建议**
    - 建议设置 5-10 个结果
    - 太多会导致返回内容过长，影响 LLM 处理
    - 太少可能信息不够全面

3. **调用频率限制**
    - SerpAPI 有调用次数限制
    - 根据您的订阅计划合理使用

## 何时使用

### 适合使用增强版的场景

- ✅ 需要详细、全面的搜索结果
- ✅ 需要对比多个来源的信息
- ✅ 搜索当前事件、新闻
- ✅ 需要获取多个相关网页链接

### 可以使用官方版的场景

- ⚠️ 只需要简单的答案
- ⚠️ 对搜索结果质量要求不高
- ⚠️ 追求极简的返回内容

## 技术细节

### 搜索结果优先级

`EnhancedSerpAPI` 按以下优先级返回结果：

1. **Answer Box**（直接答案框） - 包含直接答案时
2. **Knowledge Graph**（知识图谱） - 查询实体信息时
3. **News Results**（新闻结果） - 时事新闻查询时
4. **Sports Results**（体育结果） - 体育赛事查询时
5. **Organic Results**（常规结果） - 默认情况

### 源码位置

- 工具实现：`apps/backend/lession/src/2.8.langchain内置工具/tools/enhanced-serpapi.ts`
- Provider：`apps/backend/lession/src/2.8.langchain内置工具/providers/enhanced-serp-api.ts`
- 使用示例：`apps/backend/lession/src/2.9.langchain-agent/langchain-agent.service.ts`

## 效果对比总结

| 特性       | 官方 SerpAPI | 增强版 SerpAPI      |
| ---------- | ------------ | ------------------- |
| 结果数量   | 1个          | 5-10个（可配置）    |
| 信息完整性 | 仅摘要片段   | 标题+摘要+链接+日期 |
| 中文优化   | 无           | 有（地区+语言）     |
| 结果类型   | 有限         | 多种类型自动识别    |
| 信息质量   | ⭐⭐         | ⭐⭐⭐⭐⭐          |

## 总结

**官方 SerpAPI 的问题根源**：设计初衷是为 LLM 提供简洁的信息，但实际使用中经常导致信息不足。

**增强版解决方案**：在保持工具接口兼容的前提下，返回更多、更完整的搜索结果，让 LLM 有足够的信息做出准确回答。

🎯 **建议**：在生产环境中优先使用 `EnhancedSerpAPI`，可以显著提升搜索相关问题的回答质量。
