/**
 * next-auth边缘几点运行时
 * 将auth鉴权函数作为代理函数（之前叫middleware）
 */
import { auth } from './auth'

export default auth

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
