"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TacheFormDialog, type TacheData } from "@/components/dashboard/tache-form-dialog"
import { deleteTache } from "@/app/dashboard/taches/actions"

type UserOption = { id: string; name: string; email: string; role: string }

export function TacheActions({
  tache,
  assignableUsers = [],
  canAssign = false,
  canDelete = false,
  dossierNumero,
}: {
  tache: TacheData
  assignableUsers?: UserOption[]
  canAssign?: boolean
  canDelete?: boolean
  dossierNumero?: string
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function runDelete() {
    startTransition(async () => {
      try {
        await deleteTache(tache.id)
        toast.success("Tâche supprimée.")
        setDeleteOpen(false)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Suppression impossible.")
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Modifier
          </DropdownMenuItem>
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive data-[highlighted]:text-destructive"
              >
                <Trash2 className="size-4" /> Supprimer
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <TacheFormDialog
        mode="edit"
        tache={tache}
        assignableUsers={assignableUsers}
        canAssign={canAssign}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la tâche</DialogTitle>
            <DialogDescription>
              La tâche « {tache.titre} » sera définitivement supprimée. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {dossierNumero ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Attention : cette tâche est liée au dossier{" "}
                <span className="font-medium">{dossierNumero}</span>. Le dossier ne sera pas supprimé.
              </span>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={runDelete} disabled={pending}>
              {pending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
