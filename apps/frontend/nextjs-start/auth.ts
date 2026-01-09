/**
 * next-atuth后端运行时，
 * 具有完整的登录、鉴权、退出逻辑
 */

/**
 * bcrypt算法
 * 基于随机盐+重复加密2的n次幂来实现加密
 * 通过这种故意变慢的方式使暴力破解几乎不可能，
 * 保护数据库中的关键信息，即使被攻击了也拿不到用户密码
 */

import bcrypt from 'bcrypt'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import postgres from 'postgres'
import { z } from 'zod'

import { User } from '@/app/lib/definitions'

import { authConfig } from './auth.config'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

async function getUser(email: string): Promise<User | undefined> {
    try {
        const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`
        return user[0]
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch user:', error)
        throw new Error('Failed to fetch user.')
    }
}

export const { auth, signIn, signOut } = NextAuth({
    // 合并鉴权配置
    ...authConfig,
    providers: [
        // 添加登录许可，支持账号密码、Auth0、Google、GitHub等
        Credentials({
            // 添加账号密码登录
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({
                        email: z.string().email(),
                        password: z.string().min(6),
                    })
                    .safeParse(credentials)

                //解析失败，返回null
                if (!parsedCredentials.success) {
                    return null
                }
                const { email, password } = parsedCredentials.data
                const user = await getUser(email)

                // 用户不存在，返回null
                if (!user) return null
                const passwordsMatch = await bcrypt.compare(
                    password,
                    user.password
                )
                // 密码不匹配，返回null
                if (!passwordsMatch) return null

                // 密码匹配，返回用户
                return user
            },
        }),
    ], // Add providers with an empty array for now
})
