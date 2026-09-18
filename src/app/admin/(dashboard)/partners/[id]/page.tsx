import { notFound } from 'next/navigation'
import { deletePartner, savePartner } from '@/app/admin/(dashboard)/actions'
import { EntityForm } from '@/components/admin/EntityForm'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { DangerButton } from '@/components/admin/SaveButton'
import { count, desc, eq } from 'drizzle-orm'
import { Field, inputClass, PageHeader } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function EditPartner({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'

  const partner = isNew
    ? null
    : await db.query.partners.findFirst({ where: eq(t.partners.id, id) })
  if (!isNew && !partner) notFound()

  const [media, [{ total }]] = await Promise.all([
    db.query.mediaAssets.findMany({
      orderBy: desc(t.mediaAssets.createdAt),
      columns: { id: true, path: true, alt: true, filename: true },
    }),
    db.select({ total: count() }).from(t.partners),
  ])

  return (
    <>
      <PageHeader title={isNew ? 'New certification' : (partner?.title ?? '')} />

      <EntityForm action={savePartner}>
        {partner && <input type="hidden" name="id" value={partner.id} />}

        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            defaultValue={partner?.title ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="Order" htmlFor="order">
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={partner?.order ?? total}
            className={inputClass}
          />
        </Field>

        <MediaPicker
          name="logoId"
          label="Seal image"
          options={media}
          defaultValue={partner?.logoId}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={partner?.active ?? true}
          />
          Show on the site
        </label>
      </EntityForm>

      {partner && (
        <form action={deletePartner} className="mt-8">
          <input type="hidden" name="id" value={partner.id} />
          <DangerButton confirmText={`Delete ${partner.title}?`}>
            Delete certification
          </DangerButton>
        </form>
      )}
    </>
  )
}
