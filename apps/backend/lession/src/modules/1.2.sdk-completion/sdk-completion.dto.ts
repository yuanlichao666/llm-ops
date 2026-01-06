import { IsString } from 'class-validator'
export class CompletionDto {
    @IsString()
    message: string
}
