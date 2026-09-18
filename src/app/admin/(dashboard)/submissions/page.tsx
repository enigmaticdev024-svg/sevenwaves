import {
  deleteSubmission,
  toggleSubmissionRead,
} from '@/app/admin/(dashboard)/actions'
import { desc } from 'drizzle-orm'
import { EmptyState, PageHeader } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function SubmissionsPage() {
  const submissions = await db.query.contactSubmissions.findMany({
    orderBy: desc(t.contactSubmissions.createdAt),
    limit: 200,
  })

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Everything submitted through the contact form is stored here, whether or not email notifications are configured."
        action={
          <a
            href="/admin/submissions/export"
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Export CSV
          </a>
        }
      />

      {submissions.length === 0 ? (
        <EmptyState>No enquiries yet.</EmptyState>
      ) : (
        <ul className="space-y-4">
          {submissions.map((s) => (
            <li
              key={s.id}
              className={[
                'rounded border bg-white p-6',
                s.readAt ? 'border-slate-200' : 'border-amber',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {s.name}
                    {!s.readAt && (
                      <span className="ml-2 rounded bg-amber px-2 py-0.5 text-xs font-bold text-navy">
                        New
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-600">
                    <a href={`mailto:${s.email}`} className="underline">
                      {s.email}
                    </a>
                    {s.phone && <> · {s.phone}</>}
                  </p>
                  {s.subject && (
                    <p className="mt-1 text-sm font-medium">{s.subject}</p>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {s.createdAt.toLocaleString()}
                </p>
              </div>

              <p className="mt-4 whitespace-pre-line text-sm">{s.message}</p>

              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
                <form action={toggleSubmissionRead}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="cursor-pointer text-xs underline">
                    Mark as {s.readAt ? 'unread' : 'read'}
                  </button>
                </form>
                <form action={deleteSubmission}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="cursor-pointer text-xs text-red-700 underline"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
