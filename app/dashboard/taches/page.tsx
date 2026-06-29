import Link from "next/link"
import { Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/dashboard/page-header"
import { SearchInput } from "@/components/dashboard/search-input"
import { PrioriteBadge } from "@/components/dashboard/badges"
import { TacheStatutSelect } from "@/components/dashboard/tache-statut-select"
import { TacheFormDialog } from "@/components/dashboard/tache-form-dialog"
import { TacheActions } from "@/components/dashboard/tache-actions"
import { requireRole } from "@/lib/session"
import { formatClientName } from "@/lib/domain"
import { getTaches, getDossiersForSelect, getAssignableUsers } from "./actions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await requireRole(["AGENT", "MANAGER", "ADMIN"])
  const canManage = user.role === "ADMIN" || user.role === "MANAGER"
  const canAssign = user.role === "ADMIN"
  const canDelete = user.role === "ADMIN"
  const { q } = await searchParams
  const taches = await getTaches(q)
  const dossiers = canManage ? await getDossiersForSelect() : []
  const assignableUsers = canAssign ? await getAssignableUsers() : []

  return (
    <div>
      <PageHeader
        title="Tâches"
        description="Suivez et mettez à jour les tâches liées aux dossiers."
        action={
          canManage ? (
            <TacheFormDialog
              mode="create"
              dossiers={dossiers}
              trigger={
                <Button>
                  <Plus className="size-4" /> Nouvelle tâche
                </Button>
              }
            />
          ) : undefined
        }
      />

      <div className="mb-4">
        <SearchInput placeholder="Rechercher une tâche..." />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tâche</TableHead>
              <TableHead>Dossier</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Assignée le</TableHead>
              <TableHead>Assignée à</TableHead>
              <TableHead className="w-40">Statut</TableHead>
              {canManage ? <TableHead className="w-12" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {taches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 8 : 7} className="py-10 text-center text-muted-foreground">
                  Aucune tâche.
                </TableCell>
              </TableRow>
            ) : (
              taches.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-medium">{t.titre}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatClientName(t.dossier.client)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Link href={`/dashboard/dossiers/${t.dossierId}`} className="hover:underline">
                      {t.dossier.numero}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PrioriteBadge priorite={t.priorite} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.dateEcheance ? format(t.dateEcheance, "d MMM yyyy", { locale: fr }) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.dateAssignation ? format(t.dateAssignation, "d MMM yyyy", { locale: fr }) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.agent?.name ?? <span className="text-muted-foreground">Non assignée</span>}
                  </TableCell>
                  <TableCell>
                    <TacheStatutSelect id={t.id} statut={t.statut} />
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <TacheActions
                        tache={{
                          id: t.id,
                          titre: t.titre,
                          description: t.description,
                          priorite: t.priorite,
                          statut: t.statut,
                          dateEcheance: t.dateEcheance,
                          dossierId: t.dossierId,
                          agentId: t.agentId,
                        }}
                        assignableUsers={assignableUsers}
                        canAssign={canAssign}
                        canDelete={canDelete}
                        dossierNumero={t.dossier.numero}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
