import { Users, ShieldCheck, Briefcase, UserCircle, UserCog, Ban, UserPlus } from "lucide-react"
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
import { StatCard } from "@/components/dashboard/stat-card"
import { SearchInput } from "@/components/dashboard/search-input"
import { UserRoleSelect } from "@/components/dashboard/user-role-select"
import { UserActions } from "@/components/dashboard/user-actions"
import { UserFormDialog } from "@/components/dashboard/user-form-dialog"
import { requireRole } from "@/lib/session"
import type { AppRole } from "@/lib/auth"
import { roleColors, roleLabels } from "@/lib/domain"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getUsers, getUserStats } from "./actions"

export default async function AdministrationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const admin = await requireRole(["ADMIN"])
  const { q } = await searchParams
  const [users, stats] = await Promise.all([getUsers(q), getUserStats()])

  return (
    <div>
      <PageHeader
        title="Administration"
        description="Gérez les comptes utilisateurs, leurs rôles et leurs accès."
        action={
          <UserFormDialog
            mode="create"
            trigger={
              <Button>
                <UserPlus className="size-4" /> Nouvel utilisateur
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Utilisateurs" value={stats.total} icon={Users} />
        <StatCard label="Administrateurs" value={stats.admins} icon={ShieldCheck} accent="text-teal-600" />
        <StatCard label="Managers" value={stats.managers} icon={UserCog} accent="text-amber-600" />
        <StatCard label="Agents" value={stats.agents} icon={Briefcase} accent="text-blue-600" />
        <StatCard label="Visiteurs" value={stats.visiteurs} icon={UserCircle} accent="text-muted-foreground" />
      </div>

      {stats.banned > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <Ban className="size-4" />
          {stats.banned} compte{stats.banned > 1 ? "s" : ""} actuellement suspendu
          {stats.banned > 1 ? "s" : ""}.
        </div>
      )}

      <div className="mb-4 mt-6">
        <SearchInput placeholder="Rechercher par nom, email ou téléphone..." />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isSelf = u.id === admin.id
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-medium">
                            <span className="truncate">{u.name}</span>
                            {isSelf && (
                              <span className="rounded bg-secondary px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                                Vous
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.phone || "—"}</TableCell>
                    <TableCell>
                      {isSelf ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[u.role]}`}
                        >
                          {roleLabels[u.role]}
                        </span>
                      ) : (
                        <UserRoleSelect id={u.id} role={u.role} />
                      )}
                    </TableCell>
                    <TableCell>
                      {u.banned ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                          Suspendu
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Actif
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(u.createdAt, "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <UserActions
                          id={u.id}
                          banned={u.banned}
                          user={{
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            phone: u.phone,
                            role: u.role as AppRole,
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
