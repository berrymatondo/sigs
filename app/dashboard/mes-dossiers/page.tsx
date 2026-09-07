import Link from "next/link"
import { FolderOpen, FileText, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatutBadge, DossierTypeBadge, DossierTypeIconTile } from "@/components/dashboard/badges"
import { MiniStepper } from "@/components/dashboard/mini-stepper"
import { MessageBadge } from "@/components/dashboard/message-badge"
import { requireUser } from "@/lib/session"
import { getMyDossiers } from "../profil/actions"
import { getUnreadMessageCounts } from "../dossiers/messages-actions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function MesDossiersPage() {
  await requireUser()
  const [dossiers, unreadCounts] = await Promise.all([getMyDossiers(), getUnreadMessageCounts()])

  return (
    <div>
      <PageHeader
        title="Mes dossiers"
        description="Consultez l'avancement de vos demandes de services."
        action={
          <Button asChild>
            <Link href="/dashboard/dossiers/nouveau">
              <Plus className="size-4" /> Nouvelle demande
            </Link>
          </Button>
        }
      />

      {dossiers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <FolderOpen className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucun dossier n&apos;est encore associé à votre compte.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/dossiers/nouveau">
                <Plus className="size-4" /> Créer une demande
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {dossiers.map((d) => {
            const totalSteps = d.processDefinition?._count.steps ?? 0
            return (
              <Card key={d.id} className="overflow-hidden transition-colors hover:bg-secondary/50">
                <Link href={`/dashboard/dossiers/${d.id}`} className="block">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                    <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                      <DossierTypeIconTile type={d.type} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{d.nom}</p>
                        <p className="text-xs text-muted-foreground">{d.numero}</p>
                      </div>
                    </div>

                    <div className="sm:w-44 sm:shrink-0">
                      <DossierTypeBadge type={d.type} />
                    </div>

                    <MessageBadge count={unreadCounts[d.id] ?? 0} className="sm:w-48 sm:shrink-0" />

                    <div className="flex items-center gap-1 text-xs text-muted-foreground sm:w-36 sm:shrink-0">
                      <FileText className="size-3.5" /> {d._count.documents} document
                      {d._count.documents > 1 ? "s" : ""}
                    </div>

                    <p className="text-xs text-muted-foreground sm:w-40 sm:shrink-0">
                      Mis à jour le {format(d.updatedAt, "d MMM yyyy", { locale: fr })}
                    </p>

                    <div className="sm:ml-auto">
                      <StatutBadge statut={d.statut} />
                    </div>
                  </CardContent>
                </Link>

                {totalSteps > 0 ? (
                  <div className="flex flex-col gap-1.5 border-t bg-muted/30 px-4 py-3 sm:px-5">
                    <MiniStepper
                      totalSteps={totalSteps}
                      etapeActuelle={d.etapeActuelle}
                      isClosed={d.statut === "TERMINE" || d.statut === "ARCHIVE"}
                    />
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
