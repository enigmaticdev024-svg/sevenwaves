import { notFound } from 'next/navigation'
import { deleteProcessStep, saveProcessStep } from '@/app/admin/(dashboard)/actions'
import { EntityForm } from '@/components/admin/EntityForm'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { DangerButton } from '@/components/admin/SaveButton'
import { count, desc, eq } from 'drizzle-orm'
import { Field, inputClass, PageHeader } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function EditProcessStep({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'

  const step = isNew
    ? null
    : await db.query.processSteps.findFirst({ where: eq(t.processSteps.id, id) })
  if (!isNew && !step) notFound()

  const [media, [{ total }]] = await Promise.all([
    db.query.mediaAssets.findMany({
      orderBy: desc(t.mediaAssets.createdAt),
      columns: { id: true, path: true, alt: true, filename: true },
    }),
    db.select({ total: count() }).from(t.processSteps),
  ])

  return (
    <>
      <PageHeader
        title={isNew ? 'New process step' : (step?.title ?? '')}
        description="Each step occupies a fixed position in the homepage layout, driven by its order."
      />

      <EntityForm action={saveProcessStep}>
        {step && <input type="hidden" name="id" value={step.id} />}

        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            defaultValue={step?.title ?? ''}
            className={inputClass}
          />
        </Field>

        <Field
          label="Order"
          htmlFor="order"
          hint="0 = Planting (full-width photo), 1 = Harvesting, and so on through 7 = Bottling."
        >
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={step?.order ?? total}
            className={inputClass}
          />
        </Field>

        <Field label="Copy" htmlFor="body">
          <textarea
            id="body"
            name="body"
            rows={6}
            defaultValue={step?.body ?? ''}
            className={inputClass}
          />
        </Field>

        <MediaPicker
          name="imageId"
          label="Photo"
          options={media}
          defaultValue={step?.imageId}
        />
      </EntityForm>

      {step && (
        <form action={deleteProcessStep} className="mt-8">
          <input type="hidden" name="id" value={step.id} />
          <DangerButton confirmText={`Delete the ${step.title} step?`}>
            Delete step
          </DangerButton>
        </form>
      )}
    </>
  )
}
