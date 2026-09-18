import Image from 'next/image'
import Link from 'next/link'
import { asc } from 'drizzle-orm'
import { EmptyState, LinkButton, PageHeader, Table, Td, Th } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function ProcessList() {
  const steps = await db.query.processSteps.findMany({
    orderBy: asc(t.processSteps.order),
    with: { image: { columns: { path: true } } },
  })

  return (
    <>
      <PageHeader
        title="Production process"
        description="The steps shown on the homepage, in order. The layout is designed around eight steps."
        action={<LinkButton href="/admin/process/new">Add step</LinkButton>}
      />

      {steps.length === 0 ? (
        <EmptyState>No process steps yet.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Image</Th>
              <Th>Title</Th>
              <Th>Copy</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => (
              <tr key={s.id}>
                <Td>{s.order}</Td>
                <Td>
                  {s.image && (
                    <Image
                      src={s.image.path}
                      alt=""
                      width={80}
                      height={56}
                      className="h-14 w-20 object-cover"
                    />
                  )}
                </Td>
                <Td>
                  <span className="font-medium">{s.title}</span>
                </Td>
                <Td>
                  <span className="line-clamp-2 max-w-md text-xs text-slate-500">
                    {s.body}
                  </span>
                </Td>
                <Td>
                  <Link href={`/admin/process/${s.id}`} className="text-sm underline">
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
