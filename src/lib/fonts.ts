import localFont from 'next/font/local'

// Body font — self-hosted so builds don't depend on fonts.googleapis.com.
// Weights match the WordPress theme's Google Fonts request (300/400/700/800).
export const barlow = localFont({
  src: [
    {
      path: '../../public/fonts/barlow-latin-300-normal.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/barlow-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/barlow-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/barlow-latin-800-normal.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-barlow',
})

// Display font used for section headings, product names and drink titles.
//
// NOTE: the file shipped with the WordPress theme is a *trial* licence
// ("StingerFitTrial-Light"). It is carried over so the rebuild matches the
// current site, but a production licence (or a substitute face) is required
// before this goes live.
export const stinger = localFont({
  src: [
    {
      path: '../../public/fonts/StingerFitTrial-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/StingerFitTrial-Light.woff',
      weight: '300',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-stinger',
})
