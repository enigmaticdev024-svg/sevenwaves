'use client'

import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { CarouselControls } from '@/components/site/Carousel'
import type { Product } from '@/lib/content'

/**
 * Rebuilds the paired Slick sliders on the Our Cachaça page.
 *
 * Slick config in the original:
 *   $('.navigator').slick({ asNavFor: '.secondary', focusOnSelect: true,
 *                           arrows: true, infinite: false })
 *   $('.secondary').slick({ fade: true, arrows: false, infinite: false })
 *
 * The two are kept in sync here by mirroring `select` events between the Embla
 * instances. Other pages paint their background on the section, so it always
 * starts under the header. This page is the only one that lays the coloured
 * panel over the bottle block, so the panel is pulled up by the block's real
 * height — a fixed distance leaves a white band whenever the title or bottle
 * is taller than that distance.
 */
export function ProductShowcase({
  products,
  recipeSuggestionLabel,
}: {
  products: Product[]
  recipeSuggestionLabel: string
}) {
  const [navRef, navApi] = useEmblaCarousel({ loop: false, align: 'center' })
  const [contentRef, contentApi] = useEmblaCarousel({ loop: false }, [Fade()])
  const [selected, setSelected] = useState(0)
  const navBoxRef = useRef<HTMLDivElement>(null)
  const [navHeight, setNavHeight] = useState(0)

  // The coloured panel has to cover whatever height the title + bottle
  // actually are. That height changes with the viewport, so measure it.
  useLayoutEffect(() => {
    const el = navBoxRef.current
    if (!el) return
    const update = () => {
      const next = el.offsetHeight
      setNavHeight((prev) => (prev === next ? prev : next))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    navApi?.reInit()
    contentApi?.reInit()
  }, [navHeight, navApi, contentApi])

  // Keep both sliders on the same index.
  const syncFromNav = useCallback(() => {
    if (!navApi || !contentApi) return
    const i = navApi.selectedScrollSnap()
    setSelected(i)
    contentApi.scrollTo(i)
  }, [navApi, contentApi])

  useEffect(() => {
    if (!navApi) return
    syncFromNav()
    navApi.on('select', syncFromNav).on('reInit', syncFromNav)
  }, [navApi, syncFromNav])

  const canPrev = selected > 0
  const canNext = selected < products.length - 1

  return (
    <section
      className="relative"
      style={{ '--sw-nav-h': `${navHeight}px` } as CSSProperties}
    >
      {/* --- bottle + wordmark slider (the "navigator") ------------------ */}
      <div ref={navBoxRef} className="relative z-10">
        <div className="overflow-hidden" ref={navRef}>
          <div className="flex">
            {products.map((product) => (
              <div key={product.id} className="min-w-0 flex-[0_0_100%] overflow-hidden">
                <ProductWordmark product={product} />
                {product.bottle && (
                  <Image
                    src={product.bottle.src}
                    alt={product.name}
                    width={product.bottle.width}
                    height={product.bottle.height}
                    priority
                    sizes="(max-width: 600px) 40vw, 300px"
                    className="mx-auto block h-auto w-2/5 max-w-[300px] lg:w-auto"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <CarouselControls
          canPrev={canPrev}
          canNext={canNext}
          onPrev={() => navApi?.scrollPrev()}
          onNext={() => navApi?.scrollNext()}
          className="-bottom-[46px] lg:-bottom-10"
        />
      </div>

      {/* Pulled up by the navigator's measured height, so the colour starts
          at the header at every width. 72px keeps the copy below the arrows. */}
      <div className="relative -z-10 -mt-[var(--sw-nav-h)]">
        <div className="overflow-hidden" ref={contentRef}>
          <div className="flex items-stretch">
            {products.map((product) => (
              <div key={product.id} className="flex min-w-0 flex-[0_0_100%] flex-col overflow-hidden">
                <ProductPanel
                  product={product}
                  recipeSuggestionLabel={recipeSuggestionLabel}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * The oversized wordmark. Desktop prints the name three times — faded, solid,
 * faded. The solid copy is locked to the horizontal center of the slide; the
 * faded copies hang off either side of it and are clipped by the slide, so a
 * long name such as UMBURANA stays centered instead of being shifted left.
 * Mobile prints the solid name once, also centered.
 */
function ProductWordmark({ product }: { product: Product }) {
  const isLong = product.name.toUpperCase() === 'UMBURANA'
  const size = isLong ? 'fluid-product-umburana' : 'fluid-product'
  const name = product.name

  return (
    <>
      <div
        className={`relative hidden overflow-hidden font-display font-light uppercase lg:block ${size}`}
        aria-hidden="true"
      >
        <span className="invisible block whitespace-nowrap text-center">{name}</span>
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{ color: product.titleColor }}
        >
          {name}
          <span
            className="absolute top-0 right-full mr-[0.25em] whitespace-nowrap"
            style={{ color: product.titleFadeColor }}
          >
            {name}
          </span>
          <span
            className="absolute top-0 left-full ml-[0.25em] whitespace-nowrap"
            style={{ color: product.titleFadeColor }}
          >
            {name}
          </span>
        </span>
      </div>

      <p
        className={`my-8 block whitespace-nowrap text-center font-display font-light uppercase lg:hidden ${size}`}
        style={{ color: product.titleColor }}
        aria-hidden="true"
      >
        {name}
      </p>
    </>
  )
}

function ProductPanel({
  product,
  recipeSuggestionLabel,
}: {
  product: Product
  recipeSuggestionLabel: string
}) {
  return (
    <div
      className="relative h-full flex-1 bg-contain bg-top bg-no-repeat pb-12 pt-[calc(var(--sw-nav-h)+72px)]"
      style={{
        backgroundColor: product.accentColor,
        backgroundImage: product.background
          ? `url(${product.background.src})`
          : undefined,
      }}
    >
      <div className="w-full px-4">
        <div className="mx-auto w-full max-w-[1320px] px-3">
          <h2 className="sr-only">{product.name}</h2>

          <div className="flex flex-wrap">
            <div className="w-full text-start lg:w-1/2">
              <p className="text-lg">{product.description}</p>

              {product.recipeSuggestion && (
                <p className="mt-6 inline-block rounded-[10px] border-2 border-dotted p-[10px]">
                  <strong className="uppercase">{recipeSuggestionLabel}</strong>
                  <br />
                  {product.recipeSuggestion}
                </p>
              )}
            </div>

            {product.tastingNotes.length > 0 && (
              <div className="w-full text-start lg:ms-auto lg:w-5/12">
                <ul className="flex flex-wrap">
                  {product.tastingNotes.map((note) => (
                    <li
                      key={note}
                      className="sw-star-item w-1/2 max-xs:my-4 lg:w-1/3"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
