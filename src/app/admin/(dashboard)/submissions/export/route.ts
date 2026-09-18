import { desc } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { contactSubmissions } from '@/db/schema'

/** Escapes a value for CSV, neutralising spreadsheet formula injection. */
function cell(value: unknown): string {
  let s = String(value ?? '')
  // A leading =, +, - or @ makes Excel/Sheets treat the cell as a formula.
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const rows = await db.query.contactSubmissions.findMany({
    orderBy: desc(contactSubmissions.createdAt),
  })

  const header = [
    'Date',
    'Name',
    'Email',
    'Phone',
    'Subject',
    'Message',
    'Read',
  ]
  const body = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.name,
      r.email,
      r.phone,
      r.subject,
      r.message,
      r.readAt ? 'yes' : 'no',
    ]
      .map(cell)
      .join(','),
  )

  const csv = [header.map(cell).join(','), ...body].join('\r\n')
  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sevenwaves-enquiries-${stamp}.csv"`,
    },
  })
}
