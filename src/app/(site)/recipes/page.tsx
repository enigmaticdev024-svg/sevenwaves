import type { Metadata } from 'next'
import { RecipeSlider } from '@/components/recipes/RecipeSlider'
import { JsonLd } from '@/components/seo/JsonLd'
import { BrazilianSpirit } from '@/components/icons'
import { Container } from '@/components/site/Container'
import { getPage, getRecipes, getSiteSettings } from '@/lib/content'
import { breadcrumbSchema, recipeSchema } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('recipes')
  return {
    title: page.seoTitle ?? 'Recipes',
    description: page.seoDescription ?? undefined,
    alternates: { canonical: '/recipes' },
    openGraph: {
      title: page.seoTitle ?? 'Recipes',
      description: page.seoDescription ?? undefined,
      url: '/recipes',
      type: 'website',
    },
  }
}

/**
 * `.sw-recipes` — teal intro above the brighter drinks band. From `lg` up, the
 * seal floats beside the heading and the slider is pulled up by the intro's
 * 20rem of padding. Below that, the seal sits above a full-width centered
 * heading, and the drink follows in normal flow.
 */
export default async function RecipesPage() {
  const [page, recipes, settings] = await Promise.all([
    getPage('recipes'),
    getRecipes(),
    getSiteSettings(),
  ])

  const { content } = page

  return (
    <>
      {recipes.map((recipe) => (
        <JsonLd key={recipe.id} data={recipeSchema(recipe, settings)} />
      ))}
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'Recipes', href: '/recipes' },
        ])}
      />

      <section className="bg-teal pt-8 lg:pt-12">
        <Container className="pb-8 lg:pb-80">
          {/* `lg:flow-root` contains the floated seal. Without it the float
              escapes the intro and the slider below — which establishes its
              own block formatting context via `overflow-hidden` — shrinks to
              dodge it, landing left of centre once `-mt-80` pulls it alongside. */}
          <article className="mx-auto max-w-5xl max-lg:flex max-lg:flex-col max-lg:items-center lg:flow-root">
            <BrazilianSpirit
              className="mx-auto block h-36 w-36 fill-white lg:float-right"
              aria-hidden="true"
            />
            <h1 className="fluid-recipes-title sw-title my-6 w-full px-2 text-center text-[1.2rem] tracking-[0.16em] !text-cream lg:my-8 lg:pl-48 lg:tracking-[0.5rem]">
              {content.heading}
            </h1>
          </article>
        </Container>

        <div className="bg-teal-bright bg-[url('/images/sw-recipes-div.webp')] bg-contain bg-top bg-no-repeat pb-12 lg:pb-20">
          <Container className="lg:-mt-80">
            <RecipeSlider
              recipes={recipes}
              ingredientsLabel={content.ingredientsLabel}
              instructionsLabel={content.instructionsLabel}
            />
          </Container>
        </div>
      </section>
    </>
  )
}
