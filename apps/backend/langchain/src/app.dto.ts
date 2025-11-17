import { IsString } from 'class-validator'

export class CompleteMessageDTO {
  @IsString()
  message: string
}

export class CompleteMessageWithPromptDTO {
  @IsString()
  name: string

  @IsString()
  course: string

  @IsString()
  message: string
}
