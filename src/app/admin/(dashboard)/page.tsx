import Link from 'next/link'
import { count, desc, isNull, type SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { Card, PageHeader } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

/** Small helper so the dashboard tiles stay declarative. */
async function rowCount(table: PgTable, where?: SQL) {
  const query = db.select({ value: count() }).from(table)
  const [row] = where ? await query.where(where) : await query
  return row?.value ?? 0
}

export default async function AdminDashboard() {
  const [products, steps, recipes, partners, locations, unread, total, media] =
    await Promise.all([
      rowCount(t.products),
      rowCount(t.processSteps),
      rowCount(t.recipes),
      rowCount(t.partners),
      rowCount(t.locations),
      rowCount(t.contactSubmissions, isNull(t.contactSubmissions.readAt)),
      rowCount(t.contactSubmissions),
      rowCount(t.mediaAssets),
    ])

  const tiles = [
    { label: 'Products', value: products, href: '/admin/products' },
    { label: 'Process steps', value: steps, href: '/admin/process' },
    { label: 'Recipes', value: recipes, href: '/admin/recipes' },
    { label: 'Certifications', value: partners, href: '/admin/partners' },
    { label: 'Locations', value: locations, href: '/admin/locations' },
    { label: 'Media', value: media, href: '/admin/media' },
  ]

  const recent = await db.query.contactSubmissions.findMany({
    orderBy: desc(t.contactSubmissions.createdAt),
    limit: 5,
  })

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Manage the content of sevenwaves.com."
      />

      {unread > 0 && (
        <Link
          href="/admin/submissions"
          className="mb-6 block rounded border border-amber bg-amber/20 p-4 text-sm font-medium"
        >
          You have {unread} unread {unread === 1 ? 'enquiry' : 'enquiries'}.
        </Link>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="rounded border border-slate-200 bg-white p-6 transition-colors hover:border-navy"
          >
            <p className="text-3xl font-bold text-navy">{tile.value}</p>
            <p className="mt-1 text-sm text-slate-600">{tile.label}</p>
          </Link>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 font-bold">Recent enquiries</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">
            No enquiries yet. Submissions from the contact form appear here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((s) => (
              <li key={s.id} className="py-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">
                    {s.name}{' '}
                    <span className="font-normal text-slate-500">{s.email}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {s.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-slate-600">{s.message}</p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/admin/submissions"
          className="mt-4 inline-block text-sm underline"
        >
          View all enquiries ({total})
        </Link>
      </Card>
    </>
  )
}
