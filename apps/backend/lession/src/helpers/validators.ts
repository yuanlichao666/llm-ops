// src/validators/is-regexp-string.validator.ts
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator'

/**
 * 验证值是否是一个有效的正则表达式字符串
 */
@ValidatorConstraint({ async: false })
export class IsRegExpStringConstraint implements ValidatorConstraintInterface {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    validate(value: any, _args: ValidationArguments) {
        if (typeof value !== 'string') {
            // 如果不是字符串，我们假设它应该先通过 @IsString 验证
            return false
        }

        try {
            // 尝试创建 RegExp 对象。如果字符串格式不正确，这里会抛出 SyntaxError
            new RegExp(value)
            return true
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error)
            return false
        }
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} 必须是一个有效的正则表达式字符串`
    }
}

/**
 * 自定义装饰器：@IsRegExpString()
 * @param validationOptions 验证选项
 */
export function IsRegExpString(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsRegExpStringConstraint,
        })
    }
}
