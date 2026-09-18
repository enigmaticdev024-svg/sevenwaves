import Image from 'next/image'
import Link from 'next/link'
import { BrazilianSpirit } from '@/components/icons'
import { Container } from '@/components/site/Container'
import { Reveal } from '@/components/site/Reveal'
import { Tooltip } from '@/components/site/Tooltip'
import type { Product } from '@/lib/content'

/**
 * `.sw-cachacas` — amber background, sw-home-div2 wave on the bottom edge,
 * 15rem of bottom padding (3rem under 576px). The three bottles scale to 1.1
 * on hover and carry a tooltip with the product name.
 */
export function BottlesSection({
  products,
  heading,
  copy,
  cta,
  ctaHref,
}: {
  products: Product[]
  heading: string
  copy: string
  cta: string
  ctaHref: string
}) {
  // The homepage shows the three original bottles, matching the theme.
  const bottles = products.slice(0, 3)

  return (
    <section className="relative bg-amber bg-[url('/images/sw-home-div2.webp')] bg-contain bg-bottom bg-no-repeat pb-12 lg:pb-60">
      <Container>
        <div className="mx-auto max-w-4xl">
          <Reveal animation="fadeInTopRight" duration="1.2s" delay="1200ms">
            <BrazilianSpirit
              className="ms-auto h-44 w-44 fill-navy"
              aria-hidden="true"
            />
          </Reveal>

          <ul className="flex items-end justify-center gap-2">
            {bottles.map((product, i) => (
              <Reveal
                key={product.id}
                as="li"
                animation="bounceInUp"
                duration="1.2s"
                delay={`${300 + i * 100}ms`}
                className="flex-1"
              >
                <Tooltip label={product.name}>
                  <Link href={ctaHref} title={product.name}>
                    {product.bottle && (
                      <Image
                        src={product.bottle.src}
                        alt={product.name}
                        width={product.bottle.width}
                        height={product.bottle.height}
                        sizes="(max-width: 992px) 33vw, 300px"
                        className="h-auto w-full transition-transform duration-500 hover:scale-110"
                      />
                    )}
                  </Link>
                </Tooltip>
              </Reveal>
            ))}
          </ul>

          <div className="mt-4 text-center">
            <Reveal animation="fadeInDown" duration="1.2s" delay="800ms">
              <h2 className="sw-title mt-4">{heading}</h2>
            </Reveal>
            <Reveal animation="fadeInUp" duration="1.2s" delay="1200ms">
              <p className="mt-4 text-xl">{copy}</p>
            </Reveal>
            <Reveal animation="fadeInDown" duration="1.2s" delay="1500ms">
              <Link href={ctaHref} className="sw-btn sw-btn-outline my-4" title={cta}>
                {cta}
              </Link>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
