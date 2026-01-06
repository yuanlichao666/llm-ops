import { IsNumber, IsString } from 'class-validator'
export class UserDto {
    @IsString()
    name: string

    @IsNumber()
    age: number
}

export class PrebuiltTemplateDto {
    @IsString()
    message: string

    @IsString()
    role: string
}

export class RunnableBranchDto {
    @IsString()
    topic: string

    @IsString()
    question: string
}
