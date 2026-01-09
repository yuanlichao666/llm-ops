'use client'

import { ArrowRightIcon } from '@heroicons/react/20/solid'
import {
    AtSymbolIcon,
    // ExclamationCircleIcon,
    KeyIcon,
} from '@heroicons/react/24/outline'
import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'

import { authenticate, State } from '@/app/lib/actions'
import { lusitana } from '@/app/ui/fonts'

import { Button } from './button'
export default function LoginForm() {
    const initialState: State = {
        message: '',
        errors: {},
    }
    const [state, formAction, isPending] = useActionState(
        authenticate,
        initialState as any
    )

    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

    return (
        <form action={formAction}>
            <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
                <h1 className={`${lusitana.className} mb-3 text-2xl`}>
                    Please log in to continue.
                </h1>
                <div className="w-full">
                    <div>
                        <label
                            className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
                                required
                                aria-describedby="email-error-message"
                            />
                            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                    </div>
                    <div id="email-error-message">
                        {state.errors?.email &&
                            state.errors.email.map((error: string) => (
                                <p
                                    key={error}
                                    className="mt-2 text-sm text-red-500"
                                >
                                    {error}
                                </p>
                            ))}
                    </div>
                    <div className="mt-4">
                        <label
                            className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter password"
                                required
                                minLength={6}
                                aria-describedby="password-error-message"
                            />
                            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                    </div>
                </div>
                <div id="password-error-message">
                    {state.errors?.password &&
                        state.errors.password.map((error: string) => (
                            <p
                                key={error}
                                className="mt-2 text-sm text-red-500"
                            >
                                {error}
                            </p>
                        ))}
                </div>
                <input type="hidden" name="redirectTo" value={callbackUrl} />
                <Button aria-disabled={isPending} className="mt-4 w-full">
                    Log in{' '}
                    <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
                </Button>
                <div className="flex h-8 items-end space-x-1">
                    {/* Add form errors here */}
                </div>
            </div>
        </form>
    )
}
