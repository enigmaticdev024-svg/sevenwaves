import { AgeGate } from '@/components/site/AgeGate'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { getNavItems, getSiteSettings } from '@/lib/content'

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [nav, settings] = await Promise.all([getNavItems(), getSiteSettings()])

  return (
    // The theme wrapped everything in #principal with overflow:hidden, which
    // clips the sections that overlap via negative margins.
    <div className="overflow-hidden">
      <Header nav={nav} />
      <main>{children}</main>
      <Footer settings={settings} />
      <AgeGate settings={settings} />
    </div>
  )
}
