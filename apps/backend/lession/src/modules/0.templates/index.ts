import { PromptTemplate } from '@langchain/core/prompts'
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
} from '@langchain/core/prompts'

// 同步子问题分解器提示词
export const serialQuestionsDecomposer = new PromptTemplate({
    inputVariables: [],
    template: `
      你是一个“复杂问题拆解器”（Question Decomposer）。
      
      你的目标：
      把一个复杂问题拆分为一条“推理链”（Reasoning Chain），由多个可执行的子问题组成。

      拆解要求：
      1. 先识别问题中包含的任务、实体、关系或步骤。
      2. 以“先找信息 → 再分析 → 最终推断”的方式组织步骤。
      3. 子问题之间必须是严格的逻辑顺序，每个问题都服务于后续推理。
      4. 子问题必须是 LLM 可以直接回答的“可检索 / 可推理”问题。
      5. 不要跳步，不要直接给最终答案。

      输出格式（必须遵守）：
      
      Q1: …
      Q2: …
      Q3: …

      请根据上述结构，拆解用户的问题
    `,
})
export const serialQuestionsDecomposerPrompt = ChatPromptTemplate.fromMessages<{
    question: string
}>([
    new SystemMessagePromptTemplate({ prompt: serialQuestionsDecomposer }),
    HumanMessagePromptTemplate.fromTemplate('{question}'),
])

// 串行子问题执行器提示词
export const serialQuestionsExecutor = new PromptTemplate({
    inputVariables: ['question', 'context', 'qaHistory'],
    template: `
        你现在是一名能够逐步解决复杂任务的专家。
        你接下来需要回答一个处于任务链中的“当前子问题”。
        
        你的目标：
        结合“历史问答记录”、“当前上下文”、“当前子问题”，精准解决“当前子问题”，为下一个子问题提供可继续使用的上下文信息。

        任务规则（必须遵守）：
        1.必须使用“历史问答记录”、“当前上下文”中的信息作为已知事实来源。
        2.只回答“当前子问题”，不提前处理任何后续问题。
        3.回答必须能够被下一步直接引用，不得模糊、不讲空话。
        4.如果“历史问答记录”中出现了决策、选择、定义，你必须沿用，而不是改变它们。
        5.输出内容必须结构化、清晰、简明。不写长篇废话。
        6.不要给出总总结，不要试图回答完整任务，只回答“当前子问题”。

        当前子问题：
        {question}

        当前上下文：
        {context}

        历史问答记录：
        {qaHistory}

        请根据上述结构，回答用户的问题
    `,
})

// 串行子问题执行器提示词
export const serialQuestionsExecutorPrompt = ChatPromptTemplate.fromMessages<{
    question: string
    context: string
    qaHistory: string
}>([new SystemMessagePromptTemplate({ prompt: serialQuestionsExecutor })])

const parallelQuestionsDecomposer = new PromptTemplate({
    inputVariables: [],
    template: `
  **系统指令 (System Prompt)**:
  你是一个专业的查询分解器。你的任务是将用户提出的复杂或多方面的问题分解成多个独立的、具体的、适合进行向量数据库检索的子问题。
  
  **分解要求**:
  每个子问题必须是完整的、独立的句子，并且能够单独用于搜索。
  你必须只输出子问题列表，不要包含任何解释、编号或额外的文本。

  输出格式（必须遵守）：
  
  Q1: …
  Q2: …
  Q3: …

  请根据上述结构，拆解用户的问题：
  `,
})

export const parallelQuestionsDecomposerPrompt =
    ChatPromptTemplate.fromMessages<{
        question: string
    }>([
        new SystemMessagePromptTemplate({
            prompt: parallelQuestionsDecomposer,
        }),
        HumanMessagePromptTemplate.fromTemplate('{question}'),
    ])

// 并行子问题执行器提示词
export const parallelQuestionsExecutor = new PromptTemplate({
    inputVariables: ['question', 'context'],
    template: `
    你是一个聪明的助手，你接下来需要根据用户的提问和上下文来进行回答。

    任务规则（必须遵守）：
    1.必须使用“当前上下文”中的信息作为已知事实来源。
    2.回答必须明确，不得模糊、不讲空话，如果不知道就说不知道。

    当前上下文：
    {context}

    请根据上述结构，回答用户的问题
  `,
})

export const parallelQuestionsExecutorPrompt = ChatPromptTemplate.fromMessages<{
    question: string
    context: string
}>([
    new SystemMessagePromptTemplate({ prompt: parallelQuestionsExecutor }),
    HumanMessagePromptTemplate.fromTemplate('{question}'),
])

// 并行问题合并器提示词
export const parallelQuestionsComposer = new PromptTemplate({
    inputVariables: ['original', 'qaHistory'],
    template: `
      你是一名“多子问题结果合成专家”（Answer Merger）。
      你的任务是将多个独立子问题的回答合并成一个连贯、精准、结构化的最终答案。

      你的目标：
      基于“原始用户问题”与“每个子问题的问答”，生成一个完全整合后的最终响应。

      你必须遵守以下规则：
      1. 所有内容必须源自子问题回答，不得凭空编造。
      2. 如果多个子答案存在冲突，你必须解释冲突，并给出合理的合并结论。
      3. 不要重复子答案，必须进行真正的整合，而不是简单拼接。
      4. 保持逻辑清晰、结构化，必要时可分条但不能冗长。
      5. 回答必须直接面向“原始用户问题”，不是面向子问题。
      6. 不能提及“子问题”“拆解”“分解”“合并”等过程性词语。
      7. 整体风格必须自然、严谨、可读性强，像真人专家总结。

      原始用户问题：
      {original}

      每个子问题的问答：
      {qaHistory}

      请根据上述规则，合成最终答案。
        `,
})

export const parallelQuestionsComposerPrompt = ChatPromptTemplate.fromMessages<{
    original: string
    qaHistory: string
}>([new SystemMessagePromptTemplate({ prompt: parallelQuestionsComposer })])
