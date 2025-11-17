import { IsString } from 'class-validator'

export class CompleteMessageDto {
  @IsString()
  message: string
}
