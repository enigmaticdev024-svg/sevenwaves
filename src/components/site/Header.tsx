'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SwLogo } from '@/components/icons'

type NavItem = { id: string; label: string; href: string }

/**
 * Reproduces the theme's header behaviour:
 *  - navy bar with 1rem padding
 *  - past 10px of scroll it pins to the top, padding drops to 0 and the
 *    wordmark shrinks from 8.75rem x 4.375rem to 6.25rem x 3.125rem
 *  - the hamburger's three bars morph into an X and turn teal when open
 */
export function Header({ nav }: { nav: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the menu on navigation.
  useEffect(() => setOpen(false), [pathname])

  // Lock the page behind the open mobile menu.
  useEffect(() => {
    document.body.classList.toggle('is-locked', open)
    return () => document.body.classList.remove('is-locked')
  }, [open])

  return (
    // The theme swapped to Bootstrap's `.fixed-top` past 10px of scroll, which
    // pulls the bar out of flow and makes the page jump. `sticky` pins it the
    // same way while keeping the space reserved, so the shrink animates cleanly.
    <header
      className={[
        'sticky top-0 z-50 w-full bg-navy transition-all duration-500',
        scrolled ? 'p-0' : 'p-4',
      ].join(' ')}
    >
      <nav className="mx-auto w-full max-w-[1320px] px-3">
        <div className="flex flex-wrap items-center justify-between">
          <Link href="/" title="Seven Waves" aria-label="Seven Waves — home">
            <SwLogo
              className={[
                'fill-cream transition-all duration-500',
                scrolled ? 'w-[6.25rem] h-[3.125rem]' : 'w-[8.75rem] h-[4.375rem]',
              ].join(' ')}
            />
          </Link>

          {/* Hamburger — hidden from lg up */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="sw-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className={[
              'lg:hidden border-2 p-2 cursor-pointer',
              open ? 'border-teal-bright' : 'border-white max-md:border-teal',
            ].join(' ')}
          >
            <span
              className={[
                'block w-[35px] h-[5px] my-[6px] transition-all duration-[400ms]',
                open
                  ? 'bg-teal-bright rotate-[-45deg] translate-x-[-9px] translate-y-[6px]'
                  : 'bg-white max-md:bg-teal',
              ].join(' ')}
            />
            <span
              className={[
                'block w-[35px] h-[5px] my-[6px] transition-all duration-[400ms]',
                open ? 'bg-teal-bright opacity-0' : 'bg-white max-md:bg-teal',
              ].join(' ')}
            />
            <span
              className={[
                'block w-[35px] h-[5px] my-[6px] transition-all duration-[400ms]',
                open
                  ? 'bg-teal-bright rotate-45 translate-x-[-8px] translate-y-[-8px]'
                  : 'bg-white max-md:bg-teal',
              ].join(' ')}
            />
          </button>

          <div
            id="sw-nav"
            className={[
              'basis-full lg:basis-auto lg:ms-auto',
              open ? 'block' : 'hidden lg:block',
            ].join(' ')}
          >
            <ul className="flex flex-col lg:flex-row max-lg:my-8 max-lg:items-center">
              {nav.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={[
                        'block px-4 py-2 font-bold uppercase transition-colors',
                        active
                          ? 'bg-amber text-navy'
                          : 'text-tan hover:bg-amber hover:text-navy',
                      ].join(' ')}
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}
