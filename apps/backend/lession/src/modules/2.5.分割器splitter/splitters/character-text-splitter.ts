import { TextSplitterParams } from '@langchain/textsplitters'
import { CharacterTextSplitter as SourceCharacterTextSplitter } from '@langchain/textsplitters'

interface CharacterTextSplitterParams extends TextSplitterParams {
    separator: string | RegExp
}

// 扩展CharacterTextSplitter，支持字符串和正则表达式作为分隔符
export class CharacterTextSplitter extends SourceCharacterTextSplitter {
    constructor(fields: CharacterTextSplitterParams) {
        super(fields as any)
    }

    public async splitText(text: string): Promise<string[]> {
        if (typeof this.separator === 'string') {
            // console.log('string separator', text)
            return await super.splitText(text)
        } else {
            // console.log('regex separator', text)
            return text.split(this.separator)
        }
    }
}
