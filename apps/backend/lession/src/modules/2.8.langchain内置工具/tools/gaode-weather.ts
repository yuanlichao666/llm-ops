import { tool } from 'langchain'
import * as z from 'zod'

import { concatTemplate } from '../../../helpers/concatTemplate'

const gaodeApi = 'https://restapi.amap.com/v3'
const apiKey = 'f1250de0f16e74db555e8a9fab2c3068'

async function get_adcode(city: string): Promise<string> {
    const url = `${gaodeApi}/config/district?key=${apiKey}&keywords=${city}`
    const res = await fetch(url)
    const data = await res.json()

    if (!data.districts || data.districts.length === 0) {
        throw new Error(`无法找到城市: ${city}`)
    }

    return data.districts[0].adcode
}

async function get_weather(
    adcode: string,
    extension?: 'base' | 'all'
): Promise<string> {
    const url = `${gaodeApi}/weather/weatherInfo?key=${apiKey}&city=${adcode}&extensions=${extension}`
    const res = await fetch(url)
    const data = await res.json()

    if (!data.status) {
        throw new Error(`无法获取天气信息: ${adcode}`)
    }

    return JSON.stringify(data)
}

export const gaoDeWeather = tool(
    async ({
        city,
        extension,
    }: {
        city: string
        extension?: 'base' | 'all'
    }) => {
        return await get_adcode(city).then(adcode =>
            get_weather(adcode, extension)
        )
    },
    {
        name: 'getWeather',
        description: 'Get the weather of a city',
        schema: z.object({
            city: z.string().describe('The city to get the weather of'),
            extension: z
                .enum(['base', 'all'])
                .describe(
                    concatTemplate(
                        'The extension of the weather, ',
                        'base: only get the weather, ',
                        'all: get the weather and the weather extension'
                    )
                )
                .optional(),
        }),
    }
)
