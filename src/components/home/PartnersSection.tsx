import Image from 'next/image'
import { Container } from '@/components/site/Container'
import { Reveal } from '@/components/site/Reveal'
import type { Partner } from '@/lib/content'

/**
 * `.sw-metas` — teal band holding the certification seals. Each seal renders at
 * 13.75rem square; the heading is navy here rather than the amber used
 * elsewhere for `.sw-sobre-titulos`.
 */
export function PartnersSection({
  partners,
  heading,
}: {
  partners: Partner[]
  heading: string
}) {
  return (
    <section className="bg-teal py-12">
      <Container>
        <Reveal animation="fadeInUp" duration="1s" delay="200ms">
          <h2 className="fluid-h4 mt-4 text-center font-display font-light uppercase text-navy lg:mt-0">
            {heading}
          </h2>
        </Reveal>

        <ul className="mt-12 mb-8 flex flex-wrap items-start justify-center gap-y-8">
          {partners.map((partner, i) => (
            <Reveal
              key={partner.id}
              as="li"
              animation="fadeInLeft"
              duration="1s"
              delay={`${600 + i * 300}ms`}
              className="w-1/2 text-center lg:w-1/3"
            >
              {partner.logo && (
                <Image
                  src={partner.logo.src}
                  alt={partner.title}
                  width={partner.logo.width}
                  height={partner.logo.height}
                  sizes="220px"
                  className="mx-auto block h-[13.75rem] w-[13.75rem] object-contain"
                />
              )}
              <h3 className="fluid-h5 mt-8 font-extrabold max-xs:my-4">
                {partner.title}
              </h3>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}
