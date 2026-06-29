import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteLogo } from "@/components/site-logo"
import { StatutBadge } from "@/components/dashboard/badges"
import { prisma } from "@/lib/prisma"
import { dossierTypeLabels } from "@/lib/domain"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function SuiviPage({
  params,
}: {
  params: Promise<{ numero: string }>
}) {
  const { numero } = await params
  const dossier = await prisma.dossier.findUnique({
    where: { numero },
    include: { client: true },
  })
  if (!dossier) notFound()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-6">
        <SiteLogo />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Suivi de dossier</CardTitle>
          <p className="text-sm text-muted-foreground">{dossier.numero}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <StatutBadge statut={dossier.statut} />
          </div>
          <dl className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Service</dt>
              <dd className="font-medium">{dossierTypeLabels[dossier.type]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Intitulé</dt>
              <dd className="font-medium">{dossier.nom}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Titulaire</dt>
              <dd className="font-medium">
                {dossier.client.prenom ?? dossier.client.postnom ?? dossier.client.nom}{" "}
                {dossier.client.nom.charAt(0)}.
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Dernière mise à jour</dt>
              <dd className="font-medium">
                {format(dossier.updatedAt, "d MMM yyyy", { locale: fr })}
              </dd>
            </div>
          </dl>
          <p className="text-center text-xs text-muted-foreground">
            Pour toute question, contactez votre agence SIGS.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
