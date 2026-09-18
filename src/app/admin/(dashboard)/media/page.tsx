import Image from 'next/image'
import { desc } from 'drizzle-orm'
import { updateMediaAlt } from '@/app/admin/(dashboard)/actions'
import { MediaUploader } from '@/components/admin/MediaUploader'
import { Card, EmptyState, PageHeader } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

function formatSize(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default async function MediaPage() {
  const assets = await db.query.mediaAssets.findMany({
    orderBy: desc(t.mediaAssets.createdAt),
  })

  return (
    <>
      <PageHeader
        title="Media"
        description="Uploads are re-encoded to WebP and capped at 2400px. Alt text is used by screen readers and search engines."
      />

      <Card className="mb-8">
        <MediaUploader />
      </Card>

      {assets.length === 0 ? (
        <EmptyState>No images yet.</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded border border-slate-200 bg-white p-3"
            >
              <div className="flex h-32 items-center justify-center bg-slate-50">
                <Image
                  src={asset.path}
                  alt={asset.alt || asset.filename}
                  width={160}
                  height={128}
                  className="max-h-32 w-auto object-contain"
                />
              </div>

              <p className="mt-2 truncate text-xs font-medium" title={asset.filename}>
                {asset.filename}
              </p>
              <p className="text-xs text-slate-400">
                {asset.width}×{asset.height} · {formatSize(asset.size)}
              </p>

              <form action={updateMediaAlt} className="mt-2">
                <input type="hidden" name="id" value={asset.id} />
                <label htmlFor={`alt-${asset.id}`} className="sr-only">
                  Alt text for {asset.filename}
                </label>
                <input
                  id={`alt-${asset.id}`}
                  name="alt"
                  defaultValue={asset.alt}
                  placeholder="Alt text"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-navy"
                />
                <button
                  type="submit"
                  className="mt-1 cursor-pointer text-xs underline"
                >
                  Save alt text
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
