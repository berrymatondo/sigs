import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { CompanySettingsForm } from "@/components/dashboard/company-settings-form"
import { SystemSettingsForm } from "@/components/dashboard/system-settings-form"
import { requireRole } from "@/lib/session"
import { getCompanySettings } from "@/lib/company-settings"
import { getSystemSettings } from "@/lib/system-settings"

export default async function ParametresPage() {
  await requireRole(["ADMIN"])
  const [settings, systemSettings] = await Promise.all([getCompanySettings(), getSystemSettings()])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageHeader
          title="Coordonnées de l'entreprise"
          description="Modifiez les informations de contact affichées sur la page publique /contact."
        />
        <Card>
          <CardContent className="p-6">
            <CompanySettingsForm settings={settings} />
          </CardContent>
        </Card>
      </div>
      <div>
        <PageHeader
          title="Sécurité"
          description="Contrôlez les mesures de sécurité appliquées aux comptes du système."
        />
        <SystemSettingsForm otpLoginEnabled={systemSettings.otpLoginEnabled} />
      </div>
    </div>
  )
}
