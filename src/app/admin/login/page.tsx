import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { LoginForm } from '@/components/admin/LoginForm'
import '../../globals.css'

export const metadata: Metadata = {
  title: 'Sign in — Seven Waves Admin',
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect('/admin')

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <div className="w-full max-w-sm rounded bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-xl font-bold text-navy">Seven Waves</h1>
        <p className="mb-6 text-sm text-slate-500">Sign in to manage content.</p>
        <LoginForm />
      </div>
    </div>
  )
}
