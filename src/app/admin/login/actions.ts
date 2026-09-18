'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export type LoginState = { error?: string }

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/admin',
    })
    return {}
  } catch (error) {
    // signIn throws a redirect on success — let it through.
    if (error instanceof AuthError) {
      return { error: 'Incorrect email or password.' }
    }
    throw error
  }
}
