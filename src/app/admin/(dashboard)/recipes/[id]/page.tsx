import { notFound } from 'next/navigation'
import { deleteRecipe, saveRecipe } from '@/app/admin/(dashboard)/actions'
import { EntityForm } from '@/components/admin/EntityForm'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { DangerButton } from '@/components/admin/SaveButton'
import { count, desc, eq } from 'drizzle-orm'
import { Field, inputClass, PageHeader } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'

export default async function EditRecipe({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'

  const recipe = isNew
    ? null
    : await db.query.recipes.findFirst({ where: eq(t.recipes.id, id) })
  if (!isNew && !recipe) notFound()

  const [media, [{ total }]] = await Promise.all([
    db.query.mediaAssets.findMany({
      orderBy: desc(t.mediaAssets.createdAt),
      columns: { id: true, path: true, alt: true, filename: true },
    }),
    db.select({ total: count() }).from(t.recipes),
  ])

  return (
    <>
      <PageHeader
        title={isNew ? 'New recipe' : (recipe?.name ?? '')}
        description="Ingredients and instructions are also published as Recipe structured data for Google."
      />

      <EntityForm action={saveRecipe}>
        {recipe && <input type="hidden" name="id" value={recipe.id} />}

        <Field label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={recipe?.name ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="URL slug" htmlFor="slug" hint="Leave blank to derive from the name.">
          <input
            id="slug"
            name="slug"
            defaultValue={recipe?.slug ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="Order" htmlFor="order">
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={recipe?.order ?? total}
            className={inputClass}
          />
        </Field>

        <Field
          label="Ingredients"
          htmlFor="ingredients"
          hint="One ingredient per line."
        >
          <textarea
            id="ingredients"
            name="ingredients"
            rows={8}
            defaultValue={recipe?.ingredients ?? ''}
            className={inputClass}
          />
        </Field>

        <Field
          label="Instructions"
          htmlFor="instructions"
          hint="One step per line."
        >
          <textarea
            id="instructions"
            name="instructions"
            rows={8}
            defaultValue={recipe?.instructions ?? ''}
            className={inputClass}
          />
        </Field>

        <MediaPicker
          name="imageId"
          label="Image"
          options={media}
          defaultValue={recipe?.imageId}
        />

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={recipe?.featured ?? false}
            />
            Feature in the homepage slider
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={recipe?.active ?? true}
            />
            Show on the site
          </label>
        </div>
      </EntityForm>

      {recipe && (
        <form action={deleteRecipe} className="mt-8">
          <input type="hidden" name="id" value={recipe.id} />
          <DangerButton confirmText={`Delete ${recipe.name}?`}>
            Delete recipe
          </DangerButton>
        </form>
      )}
    </>
  )
}
