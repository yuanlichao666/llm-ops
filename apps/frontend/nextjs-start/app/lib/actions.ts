'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import postgres from 'postgres'
import { z } from 'zod'

import { signIn, signOut } from '@/auth'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const InvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string({ message: 'Customer is required.' }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Amount must be greater than 0.' }),
    status: z.enum(['pending', 'paid'], {
        message: 'Status must be pending or paid.',
    }),
    date: z.string(),
})

const CreateInvoiceFormSchema = InvoiceSchema.omit({ id: true, date: true })

const UpdateInvoiceFormSchema = InvoiceSchema.omit({ id: true, date: true })

export type State = {
    errors?: Record<string, string[]>
    message?: string | null
}

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoiceFormSchema.safeParse(
        Object.fromEntries(formData.entries())
    ) as any
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        }
    }
    const { customerId, amount, status } = validatedFields.data
    const amountInCents = Math.round(amount * 100)
    const date = new Date().toISOString().split('T')[0]
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoiceFormSchema.parse(
        Object.fromEntries(formData.entries())
    ) as any
    const amountInCents = Math.round(amount * 100)
    try {
        await sql`
        UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} WHERE id = ${id}
    `
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        return {
            message: 'Database Error: Failed to Update Invoice.',
        }
    }
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        return {
            message: 'Database Error: Failed to Delete Invoice.',
        }
    }
    revalidatePath('/dashboard/invoices')
}

const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
})

const CredentialsSchema = UserSchema.pick({ email: true, password: true })

export async function authenticate(prevState: State, formData: FormData) {
    const validatedFields = CredentialsSchema.safeParse(
        Object.fromEntries(formData.entries())
    )
    //解析失败，返回错误信息
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid credentials.',
        }
    }

    // 登录，注意next-auth通过抛出异常来进行重定向，这里不要拦截全部异常
    try {
        await signIn('credentials', formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'
                default:
                    return 'Something went wrong.'
            }
        }
        throw error
    }
}

export async function signOutAction() {
    await signOut({ redirectTo: '/login' })
}
