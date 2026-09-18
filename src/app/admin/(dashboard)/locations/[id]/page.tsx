import { notFound } from 'next/navigation'
import { deleteLocation, saveLocation } from '@/app/admin/(dashboard)/actions'
import { EntityForm } from '@/components/admin/EntityForm'
import { LocationMapPicker } from '@/components/admin/LocationMapPicker'
import { DangerButton } from '@/components/admin/SaveButton'
import { count, eq } from 'drizzle-orm'
import { Field, inputClass, PageHeader } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function EditLocation({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'

  const location = isNew
    ? null
    : await db.query.locations.findFirst({ where: eq(t.locations.id, id) })
  if (!isNew && !location) notFound()

  const [{ total }] = await db.select({ total: count() }).from(t.locations)

  return (
    <>
      <PageHeader title={isNew ? 'New location' : (location?.name ?? '')} />

      <EntityForm action={saveLocation}>
        {location && <input type="hidden" name="id" value={location.id} />}

        <Field label="Name" htmlFor="name" hint="Shown in the dropdown.">
          <input
            id="name"
            name="name"
            required
            defaultValue={location?.name ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="Order" htmlFor="order">
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={location?.order ?? total}
            className={inputClass}
          />
        </Field>

        <LocationMapPicker
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
          initial={{
            address: location?.address ?? '',
            city: location?.city ?? '',
            region: location?.region ?? '',
            postalCode: location?.postalCode ?? '',
            country: location?.country ?? 'USA',
            lat: location?.lat ?? null,
            lng: location?.lng ?? null,
          }}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Phone" htmlFor="phone">
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={location?.phone ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Website" htmlFor="websiteUrl">
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              defaultValue={location?.websiteUrl ?? ''}
              className={inputClass}
            />
          </Field>
        </div>

        <details className="mb-4 rounded border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Advanced map settings
          </summary>
          <div className="mt-4">
            <Field
              label="Legacy map embed URL"
              htmlFor="mapEmbedUrl"
              hint="Optional legacy field. The Where to Find map uses the pin coordinates above."
            >
              <input
                id="mapEmbedUrl"
                name="mapEmbedUrl"
                type="url"
                defaultValue={location?.mapEmbedUrl ?? ''}
                className={inputClass}
              />
            </Field>
          </div>
        </details>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={location?.active ?? true}
          />
          Show on the site
        </label>
      </EntityForm>

      {location && (
        <form action={deleteLocation} className="mt-8">
          <input type="hidden" name="id" value={location.id} />
          <DangerButton confirmText={`Delete ${location.name}?`}>
            Delete location
          </DangerButton>
        </form>
      )}
    </>
  )
}
