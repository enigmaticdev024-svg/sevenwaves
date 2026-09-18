import Image from 'next/image'
import Link from 'next/link'
import { asc } from 'drizzle-orm'
import { EmptyState, LinkButton, PageHeader, Table, Td, Th } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function PartnersList() {
  const partners = await db.query.partners.findMany({
    orderBy: asc(t.partners.order),
    with: { logo: { columns: { path: true } } },
  })

  return (
    <>
      <PageHeader
        title="Certifications"
        description="The seals shown in the teal band at the foot of the homepage."
        action={<LinkButton href="/admin/partners/new">Add certification</LinkButton>}
      />

      {partners.length === 0 ? (
        <EmptyState>No certifications yet.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Seal</Th>
              <Th>Title</Th>
              <Th>Status</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id}>
                <Td>{p.order}</Td>
                <Td>
                  {p.logo && (
                    <Image
                      src={p.logo.path}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                    />
                  )}
                </Td>
                <Td>
                  <span className="font-medium">{p.title}</span>
                </Td>
                <Td>
                  <span
                    className={
                      p.active ? 'text-xs text-green-700' : 'text-xs text-slate-400'
                    }
                  >
                    {p.active ? 'Live' : 'Hidden'}
                  </span>
                </Td>
                <Td>
                  <Link href={`/admin/partners/${p.id}`} className="text-sm underline">
                    Edit
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
