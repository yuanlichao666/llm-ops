/**
 * 这里将jwt鉴权的部分单独拆分出来，主要是为了分别给网关和后端打包使用，
 * 他们会分别创建next-auth实例。网关使用的是edge运行时，后端使用的是nodejs运行时
 */
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // 重定向到登录页面并携带callbackurl参数
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl))
            }
            return true
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
