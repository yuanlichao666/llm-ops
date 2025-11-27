import { IsString } from 'class-validator'

export class ChatCompletionDto {
  @IsString()
  message: string
}
