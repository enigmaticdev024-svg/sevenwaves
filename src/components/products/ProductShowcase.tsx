'use client'

import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { useCallback, useEffect, useState } from 'react'
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
 * instances. The content slider sits behind the bottle slider via a large
 * negative top margin (-724px, -780px under 600px) and z-index -1, so the
 * bottle appears to stand on top of the coloured panel.
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
    <section className="relative">
      {/* --- bottle + wordmark slider (the "navigator") ------------------ */}
      <div className="relative">
        <div className="overflow-hidden" ref={navRef}>
          <div className="flex">
            {products.map((product) => (
              <div key={product.id} className="min-w-0 flex-[0_0_100%]">
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

      {/* --- description panel (the "secondary" fade slider) ------------- */}
      <div className="relative -z-10 max-md:-mt-[780px] md:-mt-[724px]">
        <div className="overflow-hidden" ref={contentRef}>
          <div className="flex">
            {products.map((product) => (
              <div key={product.id} className="min-w-0 flex-[0_0_100%]">
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
 * The oversized wordmark. The theme printed the name three times — faded,
 * solid, faded — to create a repeating band, except for UMBURANA which is long
 * enough that it printed twice at a smaller size and shifted left.
 */
function ProductWordmark({ product }: { product: Product }) {
  const isLong = product.name.toUpperCase() === 'UMBURANA'

  return (
    <>
      {/* Desktop: repeated band */}
      <p
        className={[
          'hidden whitespace-nowrap text-center font-display font-light uppercase lg:block',
          isLong ? 'fluid-product-umburana -ml-[27%]' : 'fluid-product',
        ].join(' ')}
        style={{ color: product.titleFadeColor }}
        aria-hidden="true"
      >
        {product.name} <span style={{ color: product.titleColor }}>{product.name}</span>
        {!isLong && ` ${product.name}`}
      </p>

      {/* Mobile: single, solid */}
      <p
        className={[
          'block whitespace-nowrap text-center font-display font-light uppercase lg:hidden my-8',
          isLong ? 'fluid-product-umburana -ml-[65%]' : 'fluid-product',
        ].join(' ')}
        style={{ color: product.titleColor }}
        aria-hidden="true"
      >
        {product.name}
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
      className="relative min-h-[1420px] bg-contain bg-top bg-no-repeat md:min-h-[1060px]"
      style={{
        backgroundColor: product.accentColor,
        backgroundImage: product.background
          ? `url(${product.background.src})`
          : undefined,
      }}
    >
      <div className="absolute bottom-8 left-0 w-full px-4 md:left-1/2 md:-ml-[34.5%] md:w-auto md:px-0">
        <div className="mx-auto w-full max-w-[1320px] px-3">
          <h2 className="sr-only">{product.name}</h2>

          <div className="flex flex-wrap pt-20">
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
