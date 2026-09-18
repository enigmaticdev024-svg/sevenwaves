import type { Metadata } from 'next'
import Script from 'next/script'
import { barlow, stinger } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'Seven Waves',
    template: '%s — Seven Waves',
  },
  description: 'Genuine Cachaça Of Brazil',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `data-scroll-behavior="smooth"` is required in Next 16 for the framework
    // to manage scroll position when CSS sets `scroll-behavior: smooth`.
    // suppressHydrationWarning: the inline script below adds a class to <html>
    // before React hydrates, which would otherwise be reported as a mismatch.
    <html
      lang="en"
      className={`${barlow.variable} ${stinger.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        {children}
        {/*
          Marks the document as JS-capable before hydration. The scroll-reveal
          rules hide their targets only under `.js`, so if scripting is off or
          the bundle fails, every section stays visible instead of being stuck
          at opacity 0.
        */}
        <Script id="js-capable" strategy="beforeInteractive">
          {`document.documentElement.classList.add('js')`}
        </Script>
      </body>
    </html>
  )
}
