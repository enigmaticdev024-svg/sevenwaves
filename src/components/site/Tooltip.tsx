'use client'

import { useState, type ReactNode } from 'react'

/**
 * Replaces the Bootstrap tooltips on the three homepage bottles.
 * Shows on hover and on keyboard focus.
 */
export function Tooltip({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span
        role="tooltip"
        aria-hidden={!open}
        className={[
          'pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap',
          'rounded bg-navy px-2 py-1 text-sm text-cream transition-opacity duration-150',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {label}
      </span>
    </span>
  )
}
