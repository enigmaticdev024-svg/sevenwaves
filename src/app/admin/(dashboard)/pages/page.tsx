import Link from 'next/link'
import { asc } from 'drizzle-orm'
import { PageHeader, Table, Td, Th } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function PagesList() {
  const pages = await db.query.pages.findMany({ orderBy: asc(t.pages.slug) })

  return (
    <>
      <PageHeader
        title="Pages"
        description="Fixed page copy. Repeating content (products, recipes, process steps) has its own section."
      />

      <Table>
        <thead>
          <tr>
            <Th>Page</Th>
            <Th>URL</Th>
            <Th>Last updated</Th>
            <Th>&nbsp;</Th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id}>
              <Td>
                <span className="font-medium">{page.title}</span>
              </Td>
              <Td>
                <code className="text-xs text-slate-500">
                  {page.slug === 'home' ? '/' : `/${page.slug}`}
                </code>
              </Td>
              <Td>
                <span className="text-xs text-slate-500">
                  {page.updatedAt.toLocaleString()}
                </span>
              </Td>
              <Td>
                <Link
                  href={`/admin/pages/${page.slug}`}
                  className="text-sm underline"
                >
                  Edit
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  )
}
