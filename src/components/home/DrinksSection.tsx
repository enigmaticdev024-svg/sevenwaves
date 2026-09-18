import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/site/Container'
import { Carousel } from '@/components/site/Carousel'
import type { Recipe } from '@/lib/content'

/**
 * `.sw-drinks` — light-blue background with the sw-home-div4 wave on the bottom
 * edge and 18rem of padding below (8rem under 576px).
 *
 * The drink name is set in the display face at a very large fluid size
 * (46px -> 180px) and the image is pulled up 40px into it, growing to 45px and
 * scaling 1.1 on hover.
 *
 * The theme's inline <style> in sw-home-drinks.php positioned the two arrows
 * independently (prev left 43.7% / bottom -70px, next right 48% / bottom -94px,
 * with different percentages again under 600px). They are centred as a pair here;
 * only the vertical offset carries over, so they sit just below the glass.
 */
export function DrinksSection({ recipes }: { recipes: Recipe[] }) {
  return (
    <section className="bg-sky bg-[url('/images/sw-home-div4.webp')] bg-contain bg-bottom bg-no-repeat px-4 pb-32 max-xs:pt-8 lg:pb-72">
      <Container>
        <Carousel
          ariaLabel="Featured drinks"
          className="mx-auto"
          controlsClassName="-bottom-[46px]"
        >
          {recipes.map((recipe) => (
            <div key={recipe.id} className="relative">
              <Link href="/recipes" title={recipe.name}>
                <h2 className="fluid-drink text-center font-display font-light uppercase leading-none text-navy">
                  {recipe.name}
                </h2>
                {recipe.image && (
                  <Image
                    src={recipe.image.src}
                    alt={recipe.name}
                    width={recipe.image.width}
                    height={recipe.image.height}
                    sizes="(max-width: 992px) 90vw, 700px"
                    className="mx-auto h-auto w-auto max-w-full transition-all duration-500 max-xs:mt-0 lg:-mt-10 lg:hover:-mt-11 lg:hover:scale-110"
                  />
                )}
              </Link>
            </div>
          ))}
        </Carousel>
      </Container>
    </section>
  )
}
