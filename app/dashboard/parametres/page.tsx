import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { CompanySettingsForm } from "@/components/dashboard/company-settings-form"
import { requireRole } from "@/lib/session"
import { getCompanySettings } from "@/lib/company-settings"

export default async function ParametresPage() {
  await requireRole(["ADMIN"])
  const settings = await getCompanySettings()

  return (
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
  )
}
