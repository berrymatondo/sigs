import Link from "next/link"
import { Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { SearchInput } from "@/components/dashboard/search-input"
import { StatutBadge } from "@/components/dashboard/badges"
import { StatutFilter } from "@/components/dashboard/statut-filter"
import { DossierRowActions } from "@/components/dashboard/dossier-row-actions"
import { requireUser } from "@/lib/session"
import { dossierTypeLabels, formatClientName } from "@/lib/domain"
import { getDossiers } from "./actions"

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>
}) {
  const { q, statut } = await searchParams
  const user = await requireUser()
  const dossiers = await getDossiers(q, statut)
  const isStaff = user.role !== "VISITEUR"
  const canEdit = user.role === "ADMIN" || user.role === "MANAGER"
  const canDelete = user.role === "ADMIN"
  const canClose = isStaff

  return (
    <div>
      <PageHeader
        title="Dossiers"
        description="Suivez l'avancement de tous les dossiers de services."
        action={
          isStaff ? (
            <Button asChild>
              <Link href="/dashboard/dossiers/nouveau">
                <Plus className="size-4" /> Nouveau dossier
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput placeholder="Rechercher un dossier..." />
        <StatutFilter />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dossier</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assignée à</TableHead>
              <TableHead>Étape</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-16 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dossiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Aucun dossier trouvé.
                </TableCell>
              </TableRow>
            ) : (
              dossiers.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="font-medium">{d.nom}</div>
                    <div className="text-xs text-muted-foreground">{d.numero}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatClientName(d.client)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dossierTypeLabels[d.type]}
                  </TableCell>
                  <TableCell className="text-sm">
                    {d.agent?.name ?? <span className="text-muted-foreground">Non assigné</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {d.stepStates.length > 0 ? (
                      (() => {
                        const total = d.stepStates.length
                        const done = d.stepStates.filter((s) => s.valide).length
                        const current = d.stepStates.find((s) => !s.valide)
                        const allDone = done === total
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">
                              {allDone ? "Terminé" : (current?.nom ?? "—")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Étape {Math.min(done + (allDone ? 0 : 1), total)}/{total}
                            </span>
                          </div>
                        )
                      })()
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatutBadge statut={d.statut} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DossierRowActions
                      id={d.id}
                      numero={d.numero}
                      statut={d.statut}
                      canEdit={canEdit}
                      canClose={canClose}
                      canDelete={canDelete}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
