import { IsString } from 'class-validator'

export class StreamDto {
    @IsString()
    message: string
}
