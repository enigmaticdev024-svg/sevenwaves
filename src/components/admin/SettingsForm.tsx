'use client'

import { useActionState, useState } from 'react'
import { saveNav, saveSettings } from '@/app/admin/(dashboard)/actions'
import { SaveButton } from '@/components/admin/SaveButton'
import { Card, Field, inputClass, SubmitRow } from '@/components/admin/ui'
import type { SiteSettings } from '@/lib/content-schemas'

type NavItem = { id: string; label: string; href: string }

export function SettingsForm({
  settings,
  nav,
}: {
  settings: SiteSettings
  nav: NavItem[]
}) {
  return (
    <div className="space-y-8">
      <GeneralForm settings={settings} />
      <NavForm nav={nav} />
    </div>
  )
}

function GeneralForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction] = useActionState(saveSettings, { status: 'idle' })
  const [social, setSocial] = useState(
    settings.social.length ? settings.social : [{ label: '', href: '' }],
  )

  return (
    <form action={formAction}>
      {state.status === 'error' && (
        <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <Card className="mb-6">
        <h2 className="mb-4 font-bold">Branding</h2>
        <Field label="Site name" htmlFor="siteName">
          <input
            id="siteName"
            name="siteName"
            defaultValue={settings.siteName}
            className={inputClass}
          />
        </Field>
        <Field label="Tagline" htmlFor="tagline">
          <input
            id="tagline"
            name="tagline"
            defaultValue={settings.tagline}
            className={inputClass}
          />
        </Field>
        <Field
          label="Footer copyright"
          htmlFor="copyright"
          hint="The current year is prefixed automatically."
        >
          <input
            id="copyright"
            name="copyright"
            defaultValue={settings.copyright}
            className={inputClass}
          />
        </Field>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 font-bold">Social links</h2>
        <p className="mb-4 text-xs text-slate-500">
          Use the labels TikTok, Instagram or YouTube to get the matching icon.
        </p>
        {social.map((item, i) => (
          <div key={i} className="mb-3 grid gap-3 lg:grid-cols-[200px_1fr_auto]">
            <input
              name="socialLabel"
              defaultValue={item.label}
              placeholder="Label"
              className={inputClass}
            />
            <input
              name="socialHref"
              defaultValue={item.href}
              placeholder="https://…"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setSocial((s) => s.filter((_, j) => j !== i))}
              className="cursor-pointer rounded border border-slate-300 px-3 text-sm hover:bg-slate-50"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSocial((s) => [...s, { label: '', href: '' }])}
          className="cursor-pointer text-sm underline"
        >
          Add social link
        </button>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 font-bold">Age gate</h2>
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="ageGateEnabled"
            defaultChecked={settings.ageGateEnabled}
          />
          Require visitors to confirm their age
        </label>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Minimum age" htmlFor="ageGateMinAge">
            <input
              id="ageGateMinAge"
              name="ageGateMinAge"
              type="number"
              defaultValue={settings.ageGateMinAge}
              className={inputClass}
            />
          </Field>
          <Field
            label="Remember for (days)"
            htmlFor="ageGateRememberDays"
          >
            <input
              id="ageGateRememberDays"
              name="ageGateRememberDays"
              type="number"
              defaultValue={settings.ageGateRememberDays}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Heading" htmlFor="ageGateHeading">
          <input
            id="ageGateHeading"
            name="ageGateHeading"
            defaultValue={settings.ageGateHeading}
            className={inputClass}
          />
        </Field>
        <Field label="Body" htmlFor="ageGateBody">
          <textarea
            id="ageGateBody"
            name="ageGateBody"
            rows={2}
            defaultValue={settings.ageGateBody}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Confirm button" htmlFor="ageGateConfirm">
            <input
              id="ageGateConfirm"
              name="ageGateConfirm"
              defaultValue={settings.ageGateConfirm}
              className={inputClass}
            />
          </Field>
          <Field label="Decline button" htmlFor="ageGateDeny">
            <input
              id="ageGateDeny"
              name="ageGateDeny"
              defaultValue={settings.ageGateDeny}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-bold">Default search listing</h2>
        <Field label="Default SEO title" htmlFor="seoTitle">
          <input
            id="seoTitle"
            name="seoTitle"
            defaultValue={settings.seoTitle}
            className={inputClass}
          />
        </Field>
        <Field label="Default meta description" htmlFor="seoDescription">
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={3}
            defaultValue={settings.seoDescription}
            className={inputClass}
          />
        </Field>
      </Card>

      <SubmitRow message={state.status === 'success' ? state.message : undefined}>
        <SaveButton>Save settings</SaveButton>
      </SubmitRow>
    </form>
  )
}

function NavForm({ nav }: { nav: NavItem[] }) {
  const [state, formAction] = useActionState(saveNav, { status: 'idle' })
  const [items, setItems] = useState(
    nav.length ? nav.map((n) => ({ label: n.label, href: n.href })) : [{ label: '', href: '' }],
  )

  return (
    <form action={formAction}>
      {state.status === 'error' && (
        <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <Card>
        <h2 className="mb-4 font-bold">Main menu</h2>
        <p className="mb-4 text-xs text-slate-500">
          Order here is the order in the header.
        </p>
        {items.map((item, i) => (
          <div key={i} className="mb-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <input
              name="navLabel"
              defaultValue={item.label}
              placeholder="Label"
              className={inputClass}
            />
            <input
              name="navHref"
              defaultValue={item.href}
              placeholder="/our-cachaca"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setItems((s) => s.filter((_, j) => j !== i))}
              className="cursor-pointer rounded border border-slate-300 px-3 text-sm hover:bg-slate-50"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((s) => [...s, { label: '', href: '' }])}
          className="cursor-pointer text-sm underline"
        >
          Add menu item
        </button>
      </Card>

      <SubmitRow message={state.status === 'success' ? state.message : undefined}>
        <SaveButton>Save menu</SaveButton>
      </SubmitRow>
    </form>
  )
}
