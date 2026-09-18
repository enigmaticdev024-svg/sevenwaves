import Image from 'next/image'
import { Container } from '@/components/site/Container'
import { Reveal, type RevealAnimation } from '@/components/site/Reveal'
import type { ProcessStep } from '@/lib/content'

/**
 * `.sw-sobre` — navy, with the sw-emenda3 wave along the bottom.
 *
 * Each of the eight steps sits in its own hand-tuned position, overlapping the
 * one above it via a negative top margin. Those offsets are transcribed
 * verbatim from the theme and are all reset to 0 (or 2rem) below 576px, which
 * is what the `max-xs:!mt-0` / `max-xs:!my-8` overrides do.
 *
 * The WordPress template rendered rows in the order 0,1,2,4,3,5,6,7 — a bug
 * that put Filtering before Fermentation in the DOM. Steps are stored in the
 * correct visual order here and rendered by index.
 */

/**
 * Steps are deliberately overlapped into a collage, so copy has to sit above
 * the neighbouring photographs — `relative z-10` keeps every block legible no
 * matter which image is pulled over it.
 */
function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="fluid-h4 relative z-10 py-3 font-display font-light uppercase text-amber">
      {children}
    </h3>
  )
}

function StepBody({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={`relative z-10 whitespace-pre-line text-lg text-cream ${className}`}>
      {children}
    </p>
  )
}

function StepImage({ step }: { step: ProcessStep }) {
  if (!step.image) return null
  return (
    <Image
      src={step.image.src}
      alt={step.image.alt}
      width={step.image.width}
      height={step.image.height}
      sizes="(max-width: 992px) 100vw, 600px"
      className="h-auto w-full"
    />
  )
}

/** One step: image, heading, copy — the arrangement used by most rows. */
function Step({
  step,
  animation = 'fadeInLeft',
  duration = '1s',
  delay = '300ms',
  className = '',
  bodyClassName = '',
}: {
  step: ProcessStep
  animation?: RevealAnimation
  duration?: string
  delay?: string
  className?: string
  bodyClassName?: string
}) {
  return (
    <Reveal
      as="article"
      animation={animation}
      duration={duration}
      delay={delay}
      className={className}
    >
      <StepImage step={step} />
      <StepHeading>{step.title}</StepHeading>
      <StepBody className={bodyClassName}>{step.body}</StepBody>
    </Reveal>
  )
}

export function ProcessSection({
  steps,
  intro,
  outro,
}: {
  steps: ProcessStep[]
  intro: string
  outro: string
}) {
  const [planting, harvesting, grinding, fermentation, filtering, distillation, resting, bottling] =
    steps

  return (
    <section className="bg-navy bg-[url('/images/sw-emenda3.webp')] bg-contain bg-bottom bg-no-repeat">
      <Container>
        {/* Intro */}
        <Reveal
          as="article"
          animation="fadeInUp"
          duration="1s"
          delay="200ms"
          className="mx-auto max-w-4xl py-12 text-center"
        >
          <p className="fluid-h2 font-extrabold text-cream max-xs:my-8">{intro}</p>
        </Reveal>

        {/* --- Planting: full-width photo, copy left, decorative inset right */}
        {planting && (
          <>
            <Reveal
              animation="fadeInDown"
              duration="2s"
              delay="200ms"
              className="text-center"
            >
              <StepImage step={planting} />
            </Reveal>

            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap">
                <Reveal
                  animation="fadeInLeft"
                  duration="1s"
                  delay="200ms"
                  className="w-full lg:w-1/3"
                >
                  <StepHeading>{planting.title}</StepHeading>
                  <StepBody>{planting.body}</StepBody>
                </Reveal>

                {/* Decorative only — not part of the step's content. */}
                <Reveal
                  animation="fadeInUp"
                  duration="1s"
                  delay="300ms"
                  className="hidden lg:ms-12 lg:block lg:w-5/12 lg:-mt-60"
                >
                  <Image
                    src="/images/sw-plantations2.webp"
                    alt=""
                    width={348}
                    height={384}
                    aria-hidden="true"
                    className="h-auto w-full"
                  />
                </Reveal>
              </div>
            </div>
          </>
        )}

        {/* --- Harvesting: right-aligned, overlaps by -6.875rem */}
        {harvesting && (
          <div className="lg:-mt-[6.875rem] max-xs:my-8">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-wrap">
                <Step
                  step={harvesting}
                  animation="fadeInRight"
                  className="w-full text-end lg:ms-auto lg:w-5/12"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- Grinding: left, overlaps by -13.75rem, heading pulled up 105px */}
        {grinding && (
          <div className="lg:-mt-[13.75rem] max-xs:!mt-0">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-wrap">
                <Reveal
                  as="article"
                  animation="fadeInLeft"
                  duration="2s"
                  delay="300ms"
                  className="w-full lg:w-7/12"
                >
                  <StepImage step={grinding} />
                  <div className="lg:-mt-[105px] max-xs:-mt-10">
                    <StepHeading>{grinding.title}</StepHeading>
                  </div>
                  <StepBody className="lg:w-1/2">{grinding.body}</StepBody>
                </Reveal>
              </div>
            </div>
          </div>
        )}

        {/* --- Fermentation + Filtering share a row, overlapping by -8.125rem */}
        {(fermentation || filtering) && (
          <div className="lg:-mt-[8.125rem] max-xs:my-8">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-wrap">
                {fermentation && (
                  <Step
                    step={fermentation}
                    animation="fadeInDown"
                    duration="2s"
                    className="w-full lg:mt-[140px] lg:-me-6 lg:w-7/12 lg:px-0 max-xs:!mt-0"
                    bodyClassName="lg:w-3/4"
                  />
                )}
                {filtering && (
                  <Step
                    step={filtering}
                    animation="fadeInRight"
                    className="w-full text-end lg:w-5/12 lg:px-0"
                    bodyClassName="lg:ms-auto lg:w-3/4"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Distillation: right-aligned, overlaps by -11.5625rem */}
        {distillation && (
          <div className="lg:-mt-[11.5625rem] max-xs:!mt-0">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-wrap">
                <Step
                  step={distillation}
                  animation="fadeInRight"
                  className="w-full text-end lg:ms-auto lg:w-5/12"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- Resting: left, overlaps by -9.375rem */}
        {resting && (
          <div className="lg:-mt-[9.375rem] max-xs:my-8">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-wrap">
                <Step
                  step={resting}
                  animation="fadeInLeft"
                  className="w-full lg:w-5/12"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- Bottling: centred, overlaps by -12.5rem.
             Unlike the other steps the original nests the copy in its own
             narrower column beneath a full-width photo, so it is laid out
             explicitly rather than through <Step>. */}
        {bottling && (
          <div className="lg:-mt-[12.5rem] max-xs:!mt-0">
            <Reveal
              as="article"
              animation="fadeInDown"
              duration="1s"
              delay="300ms"
              className="mx-auto w-full lg:w-2/3"
            >
              <StepImage step={bottling} />
              <div className="lg:w-5/12">
                <StepHeading>{bottling.title}</StepHeading>
                <StepBody>{bottling.body}</StepBody>
              </div>
            </Reveal>
          </div>
        )}

        {/* Closing headline */}
        <div className="mx-auto max-w-2xl px-4 py-20 lg:py-40">
          <h2 className="sw-title text-center !text-cream">{outro}</h2>
        </div>
      </Container>
    </section>
  )
}
