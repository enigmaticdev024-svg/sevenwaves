import { PageHeader } from '@/components/admin/ui'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { getNavItems, getSiteSettings } from '@/lib/content'

export default async function SettingsPage() {
  const [settings, nav] = await Promise.all([getSiteSettings(), getNavItems()])

  return (
    <>
      <PageHeader
        title="Settings"
        description="Site-wide branding, navigation, social links and the age gate."
      />
      <SettingsForm settings={settings} nav={nav} />
    </>
  )
}
