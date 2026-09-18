'use client'

import { useActionState } from 'react'
import { MediaPicker, type MediaOption } from '@/components/admin/MediaPicker'
import { SaveButton } from '@/components/admin/SaveButton'
import { Card, Field, inputClass, SubmitRow } from '@/components/admin/ui'
import type { ActionState } from '@/app/admin/(dashboard)/actions'
import type { PageSlug } from '@/lib/content-schemas'

/**
 * Field labels and input types per page-content key. Anything not listed here
 * still renders, as a plain text input, so adding a key to a Zod schema shows
 * up in the admin without extra wiring.
 */
const FIELD_META: Record<
  string,
  { label: string; type?: 'text' | 'textarea' | 'paragraphs'; hint?: string }
> = {
  heroCopy: { label: 'Hero copy', type: 'textarea' },
  heroCta: { label: 'Hero button label' },
  heroCtaHref: { label: 'Hero button link' },
  bottlesHeading: { label: 'Bottles heading' },
  bottlesCopy: { label: 'Bottles copy', type: 'textarea' },
  bottlesCta: { label: 'Bottles button label' },
  bottlesCtaHref: { label: 'Bottles button link' },
  processIntro: { label: 'Process intro', type: 'textarea' },
  processOutro: { label: 'Process closing line', type: 'textarea' },
  partnersHeading: { label: 'Certifications heading' },
  headline: { label: 'Headline', type: 'textarea' },
  subheading: { label: 'Subheading', type: 'textarea' },
  body: {
    label: 'Body copy',
    type: 'paragraphs',
    hint: 'Separate paragraphs with a blank line.',
  },
  heading: { label: 'Heading', type: 'textarea' },
  intro: { label: 'Intro copy', type: 'textarea' },
  selectLabel: { label: 'Location dropdown label' },
  recipeSuggestionLabel: { label: '“Recipe suggestion” label' },
  ingredientsLabel: { label: '“Ingredients” label' },
  instructionsLabel: { label: '“Instructions” label' },
  successMessage: { label: 'Form success message', type: 'textarea' },
}

export function PageForm({
  slug,
  title,
  seoTitle,
  seoDescription,
  content,
  heroImageId,
  ogImageId,
  mediaOptions,
  action,
}: {
  slug: PageSlug
  title: string
  seoTitle: string | null
  seoDescription: string | null
  content: Record<string, unknown>
  heroImageId: string | null
  ogImageId: string | null
  mediaOptions: MediaOption[]
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
}) {
  const [state, formAction] = useActionState(action, { status: 'idle' })

  return (
    <form action={formAction}>
      {state.status === 'error' && (
        <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <Card className="mb-6">
        <h2 className="mb-4 font-bold">Content</h2>

        <Field label="Page title" htmlFor="title">
          <input
            id="title"
            name="title"
            defaultValue={title}
            className={inputClass}
          />
        </Field>

        {Object.entries(content).map(([key, value]) => {
          const meta = FIELD_META[key] ?? { label: key }
          const fieldName = `content.${key}`

          if (meta.type === 'paragraphs') {
            return (
              <Field key={key} label={meta.label} htmlFor={fieldName} hint={meta.hint}>
                <textarea
                  id={fieldName}
                  name={fieldName}
                  rows={16}
                  defaultValue={
                    Array.isArray(value) ? value.join('\n\n') : String(value ?? '')
                  }
                  className={inputClass}
                />
              </Field>
            )
          }

          if (meta.type === 'textarea') {
            return (
              <Field key={key} label={meta.label} htmlFor={fieldName} hint={meta.hint}>
                <textarea
                  id={fieldName}
                  name={fieldName}
                  rows={4}
                  defaultValue={String(value ?? '')}
                  className={inputClass}
                />
              </Field>
            )
          }

          return (
            <Field key={key} label={meta.label} htmlFor={fieldName} hint={meta.hint}>
              <input
                id={fieldName}
                name={fieldName}
                defaultValue={String(value ?? '')}
                className={inputClass}
              />
            </Field>
          )
        })}
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 font-bold">Images</h2>
        <MediaPicker
          name="heroImageId"
          label={slug === 'about-us' ? 'Feature image' : 'Hero image'}
          options={mediaOptions}
          defaultValue={heroImageId}
        />
        <MediaPicker
          name="ogImageId"
          label="Social share image"
          options={mediaOptions}
          defaultValue={ogImageId}
        />
      </Card>

      <Card>
        <h2 className="mb-4 font-bold">Search engine listing</h2>
        <Field
          label="SEO title"
          htmlFor="seoTitle"
          hint="Around 60 characters shows in full on Google."
        >
          <input
            id="seoTitle"
            name="seoTitle"
            defaultValue={seoTitle ?? ''}
            className={inputClass}
          />
        </Field>
        <Field
          label="Meta description"
          htmlFor="seoDescription"
          hint="Around 155 characters."
        >
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={3}
            defaultValue={seoDescription ?? ''}
            className={inputClass}
          />
        </Field>
      </Card>

      <SubmitRow message={state.status === 'success' ? state.message : undefined}>
        <SaveButton />
      </SubmitRow>
    </form>
  )
}
