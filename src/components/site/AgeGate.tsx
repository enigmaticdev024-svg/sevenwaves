'use client'

import { useEffect, useState } from 'react'
import { SwLogo } from '@/components/icons'
import type { SiteSettings } from '@/lib/content-schemas'

const COOKIE = 'sw_age_ok'

function hasConsent() {
  return document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE}=1`))
}

function setConsent(days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${COOKIE}=1; expires=${expires}; path=/; samesite=lax`
}

/**
 * 21+ gate. This exists on the live site but not in the WordPress theme files,
 * so it is rebuilt here from scratch.
 *
 * The overlay renders *on top of* the fully-rendered page rather than replacing
 * it — the markup is always in the DOM and served in the initial HTML, so
 * search engines still index every page.
 */
export function AgeGate({ settings }: { settings: SiteSettings }) {
  // Start closed so server and client markup match; open after hydration only
  // if consent is missing. This avoids a hydration mismatch and means the gate
  // never appears in the server-rendered HTML.
  const [open, setOpen] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!settings.ageGateEnabled) return
    if (!hasConsent()) setOpen(true)
  }, [settings.ageGateEnabled])

  useEffect(() => {
    document.body.classList.toggle('is-locked', open)
    return () => document.body.classList.remove('is-locked')
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sw-age-heading"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy/95 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg text-center">
        <SwLogo className="mx-auto h-auto w-36 fill-cream" aria-hidden="true" />

        {denied ? (
          <div className="mt-8">
            <h2 className="sw-title text-cream">Sorry</h2>
            <p className="mt-4 text-lg text-cream">
              You must be {settings.ageGateMinAge} or older to visit this site.
            </p>
          </div>
        ) : (
          <>
            <h2 id="sw-age-heading" className="sw-title mt-8 text-cream">
              {settings.ageGateHeading}
            </h2>
            <p className="mt-4 text-lg text-cream">{settings.ageGateBody}</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setConsent(settings.ageGateRememberDays)
                  setOpen(false)
                }}
                className="sw-btn bg-amber px-6 py-3 text-navy hover:bg-cream"
              >
                {settings.ageGateConfirm}
              </button>
              <button
                type="button"
                onClick={() => setDenied(true)}
                className="sw-btn border-2 border-cream bg-transparent px-6 py-3 text-cream hover:bg-cream hover:text-navy"
              >
                {settings.ageGateDeny}
              </button>
            </div>

            <p className="mt-6 text-sm text-cream/70">
              We&rsquo;ll remember your choice for {settings.ageGateRememberDays}{' '}
              days.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
