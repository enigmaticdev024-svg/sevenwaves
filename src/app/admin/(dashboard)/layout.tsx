import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { count, isNull } from 'drizzle-orm'
import { auth, signOut } from '@/auth'
import { db } from '@/db'
import { contactSubmissions } from '@/db/schema'

import { SwLogo } from '@/components/icons/SwLogo'
import '../../globals.css'

export const metadata: Metadata = {
  title: 'Seven Waves Admin',
  robots: { index: false, follow: false },
}

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/process', label: 'Process' },
  { href: '/admin/recipes', label: 'Recipes' },
  // { href: '/admin/partners', label: 'Certifications' },
  { href: '/admin/locations', label: 'Locations' },
  { href: '/admin/submissions', label: 'Enquiries' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/settings', label: 'Settings' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Every admin screen lives inside this route group, so a single check here
  // guards all of them. /admin/login sits outside the group and is unaffected.
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const [{ unread }] = await db
    .select({ unread: count() })
    .from(contactSubmissions)
    .where(isNull(contactSubmissions.readAt))

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-100 text-slate-900">
      <aside className="h-dvh w-60 shrink-0 overflow-y-auto bg-navy p-4 text-cream">
        <Link
          href="/admin"
          className="block w-fit"
          title="Seven Waves"
          aria-label="Seven Waves admin dashboard"
        >
          <SwLogo className="h-auto w-36 fill-cream" />
        </Link>
        <p className="mb-6 mt-2 text-xs opacity-70">Content admin</p>

        <nav>
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-white/10"
                >
                  {item.label}
                  {item.href === '/admin/submissions' && unread > 0 && (
                    <span className="ml-2 rounded-full bg-amber px-2 py-0.5 text-xs font-bold text-navy">
                      {unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 border-t border-white/20 pt-4 text-xs">
          <p className="mb-2 opacity-70">{session.user.email}</p>
          <Link href="/" target="_blank" className="block underline">
            View site
          </Link>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/admin/login' })
            }}
          >
            <button type="submit" className="mt-2 cursor-pointer underline">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
