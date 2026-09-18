'use client'

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

/**
 * Replaces WOW.js + Animate.css.
 *
 * The WordPress theme initialised WOW with `{ mobile: false }`, so reveals only
 * ran at desktop widths. The CSS in globals.css mirrors that: below 992px the
 * `[data-reveal]` rules don't apply at all and content is simply visible.
 */
export type RevealAnimation =
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'fadeInTopRight'
  | 'bounceInUp'
  | 'slideInUp'

type RevealProps = {
  children: ReactNode
  /** Matches the theme's `wow fadeInUp` etc. */
  animation?: RevealAnimation
  /** Matches `data-wow-duration`, e.g. "1.2s". */
  duration?: string
  /** Matches `data-wow-delay`, e.g. "300ms". */
  delay?: string
  className?: string
  as?: ElementType
}

export function Reveal({
  children,
  animation = 'fadeIn',
  duration = '1s',
  delay = '0ms',
  className,
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || revealed) return

    // Match WOW's mobile:false behaviour — no observer below the lg breakpoint.
    if (window.matchMedia('(max-width: 991.98px)').matches) {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            observer.disconnect()
          }
        }
      },
      // WOW's default offset is 0 with a small bottom bias.
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [revealed])

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal={animation}
      data-revealed={revealed ? 'true' : 'false'}
      style={
        {
          '--reveal-duration': duration,
          '--reveal-delay': delay,
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  )
}
