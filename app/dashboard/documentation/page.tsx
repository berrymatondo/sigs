import { Layers, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/dashboard/page-header"
import { DocumentationContent } from "@/components/dashboard/documentation/documentation-content"
import { DocumentationDownloads } from "@/components/dashboard/documentation/documentation-downloads"
import { requireRole } from "@/lib/session"
import { APP_NAME, APP_OVERVIEW } from "@/lib/documentation"

export const metadata = {
  title: "Documentation — SIGS",
  description: "Documentation métier et technique de l'application SIGS.",
}

export default async function DocumentationPage() {
  // Reserved for staff (agents, managers, admins).
  await requireRole(["AGENT", "MANAGER", "ADMIN"])

  return (
    <div>
      <PageHeader
        title="Documentation"
        description="Guide d'utilisation détaillé : chaque page décrite au niveau métier et technique."
        action={<DocumentationDownloads />}
      />

      {/* Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">{APP_NAME}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {APP_OVERVIEW.pitch}
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Layers className="size-4 text-primary" aria-hidden />
                Pile technologique
              </div>
              <ul className="flex flex-col gap-2">
                {APP_OVERVIEW.stack.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span className="text-pretty">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-primary" aria-hidden />
                Rôles et permissions
              </div>
              <ul className="flex flex-col gap-3">
                {APP_OVERVIEW.roles.map((r) => (
                  <li key={r.role} className="flex flex-col gap-1">
                    <Badge variant="secondary" className="w-fit text-xs">
                      {r.role}
                    </Badge>
                    <span className="text-sm text-muted-foreground text-pretty">{r.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentationContent />
    </div>
  )
}
