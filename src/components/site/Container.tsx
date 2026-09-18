import type { ReactNode } from 'react'

/**
 * Equivalent of Bootstrap's `.container` at the widths the theme actually used
 * (it never went above the xxl 1320px tier).
 */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-[1320px] px-3 ${className}`}>
      {children}
    </div>
  )
}
