import Link from 'next/link'
import { asc } from 'drizzle-orm'
import { Card, EmptyState, LinkButton, PageHeader, Table, Td, Th } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function LocationsList() {
  const locations = await db.query.locations.findMany({
    orderBy: asc(t.locations.order),
  })

  return (
    <>
      <PageHeader
        title="Locations"
        description="Stockists listed on the Where to Find page."
        action={<LinkButton href="/admin/locations/new">Add location</LinkButton>}
      />

      <Card className="mb-6 border-amber bg-amber/10">
        <p className="text-sm">
          The old site&rsquo;s locator was powered by Storemapper, which served
          its stockist list from its own API rather than the page HTML — so those
          addresses could not be carried over automatically. Export them from the
          Storemapper dashboard and add them here.
        </p>
      </Card>

      {locations.length === 0 ? (
        <EmptyState>No locations yet.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Name</Th>
              <Th>Where</Th>
              <Th>Map</Th>
              <Th>Status</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.id}>
                <Td>{l.order}</Td>
                <Td>
                  <span className="font-medium">{l.name}</span>
                </Td>
                <Td>
                  <span className="text-xs text-slate-500">
                    {[l.city, l.region, l.country].filter(Boolean).join(', ')}
                  </span>
                </Td>
                <Td>{l.mapEmbedUrl ? 'Yes' : '—'}</Td>
                <Td>
                  <span
                    className={
                      l.active ? 'text-xs text-green-700' : 'text-xs text-slate-400'
                    }
                  >
                    {l.active ? 'Live' : 'Hidden'}
                  </span>
                </Td>
                <Td>
                  <Link href={`/admin/locations/${l.id}`} className="text-sm underline">
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
