import { Tool } from '@langchain/core/tools'

/**
 * 增强版 SerpAPI 工具
 * 相比官方版本，主要改进：
 * 1. 返回多个搜索结果（默认前5个）
 * 2. 返回更完整的信息（标题 + 链接 + 摘要）
 * 3. 可配置返回结果数量
 */
export class EnhancedSerpAPI extends Tool {
    name = 'search'
    description =
        '一个搜索引擎工具。当你需要回答关于当前事件、最新信息或需要搜索互联网的问题时使用。输入应该是一个搜索查询字符串。'

    private apiKey: string
    private baseUrl: string
    private maxResults: number

    constructor(
        apiKey?: string,
        options?: {
            maxResults?: number // 返回的最大结果数，默认5
            baseUrl?: string
        }
    ) {
        super()
        this.apiKey = apiKey || process.env.SERPAPI_API_KEY || ''
        this.maxResults = options?.maxResults || 5
        this.baseUrl = options?.baseUrl || 'https://serpapi.com'
    }

    /** @ignore */
    async _call(input: string): Promise<string> {
        const searchParams = new URLSearchParams({
            api_key: this.apiKey,
            q: input,
            engine: 'google', // 使用 Google 搜索引擎
            google_domain: 'google.com',
            gl: 'cn', // 地区设置为中国
            hl: 'zh-cn', // 语言设置为简体中文
            num: String(this.maxResults), // 请求的结果数量
        })

        const url = `${this.baseUrl}/search?${searchParams}`
        const response = await fetch(url)
        const data = await response.json()

        if (data.error) {
            throw new Error(`SerpAPI 错误: ${data.error}`)
        }

        // 优先检查是否有直接答案框
        if (data.answer_box) {
            const answerBox = Array.isArray(data.answer_box)
                ? data.answer_box[0]
                : data.answer_box
            if (answerBox.result)
                return this.formatAnswerBox(answerBox, data.organic_results)
            if (answerBox.answer)
                return this.formatAnswerBox(answerBox, data.organic_results)
        }

        // 检查知识图谱
        if (data.knowledge_graph) {
            return this.formatKnowledgeGraph(
                data.knowledge_graph,
                data.organic_results
            )
        }

        // 检查新闻结果
        if (data.news_results && data.news_results.length > 0) {
            return this.formatNewsResults(data.news_results)
        }

        // 检查体育赛事结果
        if (data.sports_results) {
            return this.formatSportsResults(data.sports_results)
        }

        // 返回常规搜索结果
        if (data.organic_results && data.organic_results.length > 0) {
            return this.formatOrganicResults(data.organic_results)
        }

        return '未找到相关搜索结果'
    }

    /**
     * 格式化答案框结果
     */
    private formatAnswerBox(answerBox: any, organicResults?: any[]): string {
        const parts: string[] = []

        if (answerBox.title) {
            parts.push(`【直接答案】`)
            parts.push(`标题: ${answerBox.title}`)
        }

        if (answerBox.answer) {
            parts.push(`答案: ${answerBox.answer}`)
        } else if (answerBox.result) {
            parts.push(`答案: ${answerBox.result}`)
        }

        if (answerBox.snippet) {
            parts.push(`详情: ${answerBox.snippet}`)
        }

        // 如果还有常规搜索结果，也附加上
        if (organicResults && organicResults.length > 0) {
            parts.push('\n【相关搜索结果】')
            parts.push(this.formatOrganicResults(organicResults.slice(0, 3)))
        }

        return parts.join('\n')
    }

    /**
     * 格式化知识图谱结果
     */
    private formatKnowledgeGraph(
        knowledgeGraph: any,
        organicResults?: any[]
    ): string {
        const parts: string[] = ['【知识图谱】']

        if (knowledgeGraph.title) {
            parts.push(`标题: ${knowledgeGraph.title}`)
        }

        if (knowledgeGraph.type) {
            parts.push(`类型: ${knowledgeGraph.type}`)
        }

        if (knowledgeGraph.description) {
            parts.push(`描述: ${knowledgeGraph.description}`)
        }

        // 添加其他有用的字段
        const usefulFields = [
            'founded',
            'headquarters',
            'ceo',
            'founder',
            'parent_organization',
            'subsidiaries',
        ]
        usefulFields.forEach(field => {
            if (knowledgeGraph[field]) {
                parts.push(
                    `${field}: ${typeof knowledgeGraph[field] === 'string' ? knowledgeGraph[field] : JSON.stringify(knowledgeGraph[field])}`
                )
            }
        })

        // 附加常规搜索结果
        if (organicResults && organicResults.length > 0) {
            parts.push('\n【相关搜索结果】')
            parts.push(this.formatOrganicResults(organicResults.slice(0, 3)))
        }

        return parts.join('\n')
    }

    /**
     * 格式化新闻结果
     */
    private formatNewsResults(newsResults: any[]): string {
        const results = newsResults
            .slice(0, this.maxResults)
            .map((news, index) => {
                const parts = [`${index + 1}. ${news.title}`]

                if (news.snippet) {
                    parts.push(`   ${news.snippet}`)
                }

                if (news.date) {
                    parts.push(`   日期: ${news.date}`)
                }

                if (news.source) {
                    parts.push(`   来源: ${news.source}`)
                }

                if (news.link) {
                    parts.push(`   链接: ${news.link}`)
                }

                return parts.join('\n')
            })

        return `【新闻搜索结果（共${newsResults.length}条，显示前${results.length}条）】\n\n${results.join('\n\n')}`
    }

    /**
     * 格式化体育赛事结果
     */
    private formatSportsResults(sportsResults: any): string {
        const parts: string[] = ['【体育赛事结果】']

        if (sportsResults.title) {
            parts.push(`赛事: ${sportsResults.title}`)
        }

        if (sportsResults.game_spotlight) {
            const game = sportsResults.game_spotlight
            if (game.date) parts.push(`日期: ${game.date}`)
            if (game.stadium) parts.push(`场地: ${game.stadium}`)
            if (game.teams) {
                game.teams.forEach((team: any) => {
                    parts.push(`${team.name}: ${team.score || '未开赛'}`)
                })
            }
        }

        return parts.join('\n')
    }

    /**
     * 格式化常规搜索结果（返回多个结果，包含完整信息）
     */
    private formatOrganicResults(organicResults: any[]): string {
        const results = organicResults
            .slice(0, this.maxResults)
            .map((result, index) => {
                const parts = [`${index + 1}. ${result.title || '无标题'}`]

                if (result.snippet) {
                    parts.push(`   ${result.snippet}`)
                }

                if (result.link) {
                    parts.push(`   链接: ${result.link}`)
                }

                // 如果有日期信息也显示
                if (result.date) {
                    parts.push(`   日期: ${result.date}`)
                }

                return parts.join('\n')
            })

        return `【搜索结果（共${organicResults.length}条，显示前${results.length}条）】\n\n${results.join('\n\n')}`
    }
}
