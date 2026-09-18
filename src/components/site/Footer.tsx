import Image from 'next/image'
import Link from 'next/link'
import { InstagramIcon } from '@/components/icons'
import type { SiteSettings } from '@/lib/content-schemas'

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
    </svg>
  )
}

function YouTubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
    </svg>
  )
}

const SOCIAL_ICONS: Record<
  string,
  (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
}

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-cream px-4 py-12">
      <div className="mx-auto w-full max-w-[1320px] px-3">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
          <div className="flex flex-col justify-center">
            <Link href="/" aria-label="Seven Waves — back to top">
              <Image
                src="/images/seven-waves-logo.svg"
                alt="Seven Waves"
                width={400}
                height={100}
                className="h-auto w-[min(400px,80vw)]"
              />
            </Link>
            <p className="mt-4 text-sm text-navy">
              © {year} {settings.copyright}
            </p>
          </div>

          <ul className="flex items-center gap-4">
            {settings.social.map((link) => {
              const key = link.label.toLowerCase()
              const Icon = SOCIAL_ICONS[key]
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className="block text-navy transition-opacity hover:opacity-70"
                  >
                    {Icon ? (
                      <Icon className="h-6 w-6 fill-navy" aria-hidden="true" />
                    ) : (
                      link.label
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </footer>
  )
}
