export const concatTemplate = (
    templates: string[] | string,
    ...rest: string[]
) => {
    return [templates, rest].flat().join('\n')
}
