'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { ArrowIcon } from '@/components/icons'

/**
 * Replaces the Slick slider used for the homepage drinks strip and the recipes
 * page. Slick was configured as:
 *   { dots: false, infinite: true, speed: 300, slidesToShow: 1,
 *     autoplay: true, autoplaySpeed: 5000 }
 *
 * The theme positioned each arrow separately, with percentage left/right offsets
 * and bottom values that differed between the two by 24px — so the pair rendered
 * diagonally staggered, and the gap between them scaled with the viewport (they
 * overlapped around 1440px). The two now share one centred flex row, so sections
 * only choose the vertical offset.
 */
export type CarouselProps = {
  children: ReactNode[]
  autoplay?: boolean
  autoplayDelay?: number
  loop?: boolean
  className?: string
  /** Vertical placement of the arrow pair, e.g. `-bottom-12` (overlay) or `mt-12` (flow). */
  controlsClassName?: string
  /**
   * `overlay` floats the arrows over/below the slider on absolute offsets;
   * `flow` puts them after it in normal flow, which is what you want when slide
   * heights differ — the track is as tall as the longest slide, so an overlaid
   * arrow that clears the shortest one will sit on top of the longest.
   */
  controlsLayout?: 'overlay' | 'flow' | 'slide'
  ariaLabel?: string
}

type CarouselControlsContextValue = {
  selectedIndex: number
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
}

const CarouselControlsContext =
  createContext<CarouselControlsContextValue | null>(null)

export function Carousel({
  children,
  autoplay = true,
  autoplayDelay = 5000,
  loop = true,
  className = '',
  controlsClassName = 'bottom-8',
  controlsLayout = 'overlay',
  ariaLabel = 'Carousel',
}: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop, align: 'start', duration: 20 },
    autoplay
      ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })]
      : [],
  )
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect).on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const controlsContext = {
    selectedIndex,
    canPrev,
    canNext,
    onPrev: () => emblaApi?.scrollPrev(),
    onNext: () => emblaApi?.scrollNext(),
  }

  return (
    <CarouselControlsContext.Provider value={controlsContext}>
      <div
        className={`relative ${className}`}
        role="region"
        aria-label={ariaLabel}
      >
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {children.map((child, i) => (
              <div className="min-w-0 flex-[0_0_100%]" key={i}>
                {child}
              </div>
            ))}
          </div>
        </div>

        {controlsLayout !== 'slide' && (
          <CarouselControls
            canPrev={canPrev}
            canNext={canNext}
            onPrev={controlsContext.onPrev}
            onNext={controlsContext.onNext}
            className={controlsClassName}
            layout={controlsLayout}
          />
        )}
      </div>
    </CarouselControlsContext.Provider>
  )
}

/**
 * Reserves an in-slide position for the controls and renders the interactive
 * pair only in the selected slide, avoiding duplicate focusable buttons.
 */
export function CarouselControlsSlot({
  slideIndex,
  className = '',
}: {
  slideIndex: number
  className?: string
}) {
  const controls = useContext(CarouselControlsContext)

  if (!controls) {
    throw new Error('CarouselControlsSlot must be rendered inside Carousel')
  }

  if (controls.selectedIndex !== slideIndex) {
    return <div className={`h-12 ${className}`} aria-hidden="true" />
  }

  return (
    <CarouselControls
      canPrev={controls.canPrev}
      canNext={controls.canNext}
      onPrev={controls.onPrev}
      onNext={controls.onNext}
      className={className}
      layout="flow"
    />
  )
}

/**
 * The arrow pair, centred on the slider as a single unit. Anchored with
 * `left-1/2` + `-translate-x-1/2` rather than mirrored percentage offsets, so the
 * gap stays fixed at every viewport width instead of scaling with it.
 *
 * With `layout="overlay"` the parent must be positioned and `className` supplies
 * the vertical offset; with `layout="flow"` the pair simply follows the slider.
 */
export function CarouselControls({
  canPrev,
  canNext,
  onPrev,
  onNext,
  className = '',
  layout = 'overlay',
}: {
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
  layout?: 'overlay' | 'flow'
}) {
  return (
    <div
      className={[
        'z-[60] flex items-center gap-4',
        layout === 'overlay'
          ? 'absolute left-1/2 -translate-x-1/2'
          : 'relative mx-auto w-fit',
        className,
      ].join(' ')}
    >
      <CarouselButton direction="prev" disabled={!canPrev} onClick={onPrev} />
      <CarouselButton direction="next" disabled={!canNext} onClick={onNext} />
    </div>
  )
}

/**
 * The theme's arrow: a 48x48 button showing sw-btn, with the "previous" one
 * mirrored via scaleX(-1). Disabled arrows drop to 25% opacity.
 */
export function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous slide' : 'Next slide'}
      className={[
        'h-12 w-12 shrink-0 cursor-pointer border-0 bg-transparent p-0 transition-opacity',
        direction === 'prev' ? '-scale-x-100' : '',
        disabled ? 'opacity-25' : 'opacity-75 hover:opacity-100',
      ].join(' ')}
    >
      <ArrowIcon className="h-12 w-12" aria-hidden="true" />
    </button>
  )
}
