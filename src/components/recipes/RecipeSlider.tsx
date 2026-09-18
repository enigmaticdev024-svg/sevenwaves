'use client'

import Image from 'next/image'
import {
  Carousel,
  CarouselControlsSlot,
} from '@/components/site/Carousel'
import type { Recipe } from '@/lib/content'
import { stinger } from '@/lib/fonts'

/**
 * The recipes-page slider. Same Slick setup as the homepage strip, but the
 * title uses the smaller `bigtitle` scale (46px -> 106px) and each slide
 * carries an ingredients / instructions pair below the image.
 *
 * The theme positioned the arrows with fixed offsets (bottom: 300px/276px on
 * desktop, 500px/476px under 600px) which landed them on top of the recipe
 * copy. They are anchored below the copy and centred as a pair here, keeping the
 * same mirrored sw-btn styling.
 */
export function RecipeSlider({
  recipes,
  ingredientsLabel,
  instructionsLabel,
}: {
  recipes: Recipe[]
  ingredientsLabel: string
  instructionsLabel: string
}) {
  return (
    <Carousel
      ariaLabel="Recipes"
      autoplay={false}
      className="mx-auto"
      controlsLayout="slide"
    >
      {recipes.map((recipe, index) => (
        <article key={recipe.id}>
          <h2
            className={`${stinger.className} fluid-drink-big text-center font-light leading-none text-cream`}
          >
            {recipe.name}
          </h2>

          {recipe.image && (
            <Image
              src={recipe.image.src}
              alt={recipe.name}
              width={recipe.image.width}
              height={recipe.image.height}
              sizes="(max-width: 992px) 90vw, 700px"
              className="mx-auto h-auto w-auto max-w-full transition-transform duration-500 ease-out hover:scale-[1.2]"
            />
          )}

          <CarouselControlsSlot slideIndex={index} className="mt-12" />

          <div className="mx-auto mt-12 flex w-full max-w-4xl flex-wrap gap-8 px-4 lg:flex-nowrap">
            <div className="w-full lg:w-1/2">
              <strong>{recipe.name}</strong>
              <br />
              <br />
              <strong>{ingredientsLabel}</strong>
              <ul>
                {recipe.ingredients
                  .split(/\n+/)
                  .map((ingredient) => ingredient.trim())
                  .filter(Boolean)
                  .map((ingredient, index) => (
                    <li key={`${ingredient}-${index}`}>{ingredient}</li>
                  ))}
              </ul>
            </div>
            <div className="w-full lg:w-1/2">
              <strong>{instructionsLabel}</strong>
              <p className="whitespace-pre-line">{recipe.instructions}</p>
            </div>
          </div>
        </article>
      ))}
    </Carousel>
  )
}
