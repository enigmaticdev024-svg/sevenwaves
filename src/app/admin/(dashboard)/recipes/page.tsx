import Image from 'next/image'
import Link from 'next/link'
import { asc } from 'drizzle-orm'
import { EmptyState, LinkButton, PageHeader, Table, Td, Th } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function RecipesList() {
  const recipes = await db.query.recipes.findMany({
    orderBy: asc(t.recipes.order),
    with: { image: { columns: { path: true } } },
  })

  return (
    <>
      <PageHeader
        title="Recipes"
        description="Shown on the Recipes page. Featured recipes also appear in the homepage slider."
        action={<LinkButton href="/admin/recipes/new">Add recipe</LinkButton>}
      />

      {recipes.length === 0 ? (
        <EmptyState>No recipes yet.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Image</Th>
              <Th>Name</Th>
              <Th>Featured</Th>
              <Th>Status</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id}>
                <Td>{r.order}</Td>
                <Td>
                  {r.image && (
                    <Image
                      src={r.image.path}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                    />
                  )}
                </Td>
                <Td>
                  <span className="font-medium">{r.name}</span>
                </Td>
                <Td>{r.featured ? 'Yes' : '—'}</Td>
                <Td>
                  <span
                    className={
                      r.active ? 'text-xs text-green-700' : 'text-xs text-slate-400'
                    }
                  >
                    {r.active ? 'Live' : 'Hidden'}
                  </span>
                </Td>
                <Td>
                  <Link href={`/admin/recipes/${r.id}`} className="text-sm underline">
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
