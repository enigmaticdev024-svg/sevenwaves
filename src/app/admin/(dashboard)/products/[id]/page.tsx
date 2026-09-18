import { notFound } from 'next/navigation'
import { deleteProduct, saveProduct } from '@/app/admin/(dashboard)/actions'
import { ColorPickerInput } from '@/components/admin/ColorPickerInput'
import { EntityForm } from '@/components/admin/EntityForm'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { DangerButton } from '@/components/admin/SaveButton'
import { count, desc, eq } from 'drizzle-orm'
import { Field, inputClass, PageHeader } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'

  const product = isNew
    ? null
    : await db.query.products.findFirst({ where: eq(t.products.id, id) })
  if (!isNew && !product) notFound()

  const [media, [{ total }]] = await Promise.all([
    db.query.mediaAssets.findMany({
      orderBy: desc(t.mediaAssets.createdAt),
      columns: { id: true, path: true, alt: true, filename: true },
    }),
    db.select({ total: count() }).from(t.products),
  ])

  return (
    <>
      <PageHeader
        title={isNew ? 'New product' : (product?.name ?? '')}
        description="Shown on Our Cachaça; the first three also appear on the homepage."
      />

      <EntityForm action={saveProduct}>
        {product && <input type="hidden" name="id" value={product.id} />}

        <Field label="Name" htmlFor="name" hint="Displayed in uppercase.">
          <input
            id="name"
            name="name"
            required
            defaultValue={product?.name ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="URL slug" htmlFor="slug" hint="Leave blank to derive from the name.">
          <input
            id="slug"
            name="slug"
            defaultValue={product?.slug ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="Order" htmlFor="order" hint="Lower numbers appear first.">
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={product?.order ?? total}
            className={inputClass}
          />
        </Field>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={product?.description ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="Recipe suggestion" htmlFor="recipeSuggestion">
          <input
            id="recipeSuggestion"
            name="recipeSuggestion"
            defaultValue={product?.recipeSuggestion ?? ''}
            className={inputClass}
          />
        </Field>

        <Field
          label="Tasting notes"
          htmlFor="tastingNotes"
          hint="One per line. Each is shown under a star."
        >
          <textarea
            id="tastingNotes"
            name="tastingNotes"
            rows={7}
            defaultValue={(product?.tastingNotes ?? []).join('\n')}
            className={inputClass}
          />
        </Field>

        <MediaPicker
          name="bottleImageId"
          label="Bottle image"
          options={media}
          defaultValue={product?.bottleImageId}
        />
        <MediaPicker
          name="bgImageId"
          label="Panel background"
          options={media}
          defaultValue={product?.bgImageId}
        />
        <MediaPicker
          name="animalImageId"
          label="Illustration"
          options={media}
          defaultValue={product?.animalImageId}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Panel colour" htmlFor="accentColor">
            <ColorPickerInput
              id="accentColor"
              name="accentColor"
              defaultValue={product?.accentColor ?? '#eea33b'}
            />
          </Field>
          <Field label="Wordmark colour" htmlFor="titleColor">
            <ColorPickerInput
              id="titleColor"
              name="titleColor"
              defaultValue={product?.titleColor ?? '#232e44'}
            />
          </Field>
          <Field
            label="Wordmark faded colour"
            htmlFor="titleFadeColor"
            hint="The repeated echo either side. Use opacity to control the fade."
          >
            <ColorPickerInput
              id="titleFadeColor"
              name="titleFadeColor"
              defaultValue={product?.titleFadeColor ?? 'rgba(35,46,68,.1)'}
              allowAlpha
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
          />
          Show on the site
        </label>
      </EntityForm>

      {product && (
        <form action={deleteProduct} className="mt-8">
          <input type="hidden" name="id" value={product.id} />
          <DangerButton confirmText={`Delete ${product.name}? This cannot be undone.`}>
            Delete product
          </DangerButton>
        </form>
      )}
    </>
  )
}
