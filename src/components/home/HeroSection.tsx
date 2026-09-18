import Image from 'next/image'
import Link from 'next/link'
import { Reveal } from '@/components/site/Reveal'
import type { Media } from '@/lib/content'

/**
 * `.sw-home` — cream background with the sw-home-div1 wave sitting on the
 * bottom edge, 17rem of padding below the copy to clear it (8rem under 576px).
 */
export function HeroSection({
  image,
  copy,
  cta,
  ctaHref,
}: {
  image: Media
  copy: string
  cta: string
  ctaHref: string
}) {
  return (
    <section
      className="bg-cream bg-[url('/images/sw-home-div1.webp')] bg-contain bg-bottom bg-no-repeat pb-32 max-xs:pb-32 lg:pb-[17rem]"
    >
      {image && (
        <Reveal animation="fadeInDown" duration="1s">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            priority
            sizes="100vw"
            className="h-auto w-full"
          />
        </Reveal>
      )}

      <Reveal
        animation="fadeIn"
        duration="2s"
        delay="300ms"
        className="mx-auto w-full max-w-[1320px] px-4"
      >
        <div className="mx-auto max-w-2xl px-4 pt-8 text-center max-xs:pb-0 lg:px-4 lg:pt-20 lg:pb-60">
          <p className="text-xl lg:text-3xl">{copy}</p>
          <Link
            href={ctaHref}
            className="sw-btn sw-btn-primary mt-8"
            title={cta}
          >
            {cta}
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
