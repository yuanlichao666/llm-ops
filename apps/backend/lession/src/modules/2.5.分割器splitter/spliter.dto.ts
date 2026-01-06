import {
    IsArray,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator'

import { IsRegExpString } from '../../helpers/validators'
export class SplitWithUserSeparatorDto {
    @IsArray()
    @IsString({ each: true })
    separators: string[]
    @IsNumber()
    chunkSize: number
    @IsNumber()
    chunkOverlap: number
}

export class SemanticTextSplitterDto {
    @IsEnum(['percentile', 'standard_deviation', 'interquartile', 'gradient'])
    thresholdType:
        | 'percentile'
        | 'standard_deviation'
        | 'interquartile'
        | 'gradient'

    @IsOptional()
    @IsNumber()
    thresholdAmount?: number

    @IsOptional()
    @IsNumber()
    numberOfChunks?: number

    @IsOptional()
    @IsRegExpString()
    separator?: RegExp
}
