import Link from "next/link"
import { FolderOpen, FileText, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatutBadge } from "@/components/dashboard/badges"
import { requireUser } from "@/lib/session"
import { dossierTypeLabels } from "@/lib/domain"
import { getMyDossiers } from "../profil/actions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function MesDossiersPage() {
  await requireUser()
  const dossiers = await getMyDossiers()

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
        <div className="grid gap-4 sm:grid-cols-2">
          {dossiers.map((d) => (
            <Link key={d.id} href={`/dashboard/dossiers/${d.id}`}>
              <Card className="h-full transition-colors hover:bg-secondary">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.nom}</p>
                      <p className="text-xs text-muted-foreground">{d.numero}</p>
                    </div>
                    <StatutBadge statut={d.statut} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{dossierTypeLabels[d.type]}</span>
                    <span className="flex items-center gap-1">
                      <FileText className="size-3" /> {d._count.documents}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mis à jour le {format(d.updatedAt, "d MMM yyyy", { locale: fr })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
