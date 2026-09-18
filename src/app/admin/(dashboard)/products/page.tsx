import Image from 'next/image'
import Link from 'next/link'
import { asc } from 'drizzle-orm'
import { EmptyState, LinkButton, PageHeader, Table, Td, Th } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function ProductsList() {
  const products = await db.query.products.findMany({
    orderBy: asc(t.products.order),
    with: { bottleImage: { columns: { path: true } } },
  })

  return (
    <>
      <PageHeader
        title="Products"
        description="The cachaças shown on Our Cachaça and the homepage."
        action={<LinkButton href="/admin/products/new">Add product</LinkButton>}
      />

      {products.length === 0 ? (
        <EmptyState>No products yet.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Bottle</Th>
              <Th>Name</Th>
              <Th>Tasting notes</Th>
              <Th>Status</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <Td>{p.order}</Td>
                <Td>
                  {p.bottleImage && (
                    <Image
                      src={p.bottleImage.path}
                      alt=""
                      width={40}
                      height={60}
                      className="h-14 w-10 object-contain"
                    />
                  )}
                </Td>
                <Td>
                  <span className="font-medium">{p.name}</span>
                  <br />
                  <code className="text-xs text-slate-500">/{p.slug}</code>
                </Td>
                <Td>
                  <span className="text-xs text-slate-500">
                    {p.tastingNotes.length} notes
                  </span>
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
                  <Link href={`/admin/products/${p.id}`} className="text-sm underline">
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
