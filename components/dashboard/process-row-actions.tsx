"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react"
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
import { deleteProcessDefinition, toggleProcessActif } from "@/app/dashboard/process/actions"

export function ProcessRowActions({
  id,
  actif,
  locked,
  canDelete,
}: {
  id: string
  actif: boolean
  locked: boolean
  canDelete: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function runToggle() {
    startTransition(async () => {
      try {
        await toggleProcessActif(id, !actif)
        toast.success(actif ? "Process désactivé." : "Process activé.")
        router.refresh()
      } catch {
        toast.error("Action impossible.")
      }
    })
  }

  function runDelete() {
    startTransition(async () => {
      try {
        await deleteProcessDefinition(id)
        toast.success("Process supprimé.")
        setConfirmDelete(false)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Suppression impossible.")
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="size-8" />}
          aria-label="Actions du process"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem render={<Link href={`/dashboard/process/${id}`} />}>
            <Pencil className="size-4" /> {locked ? "Consulter" : "Modifier le layout"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={runToggle}>
            <Power className="size-4" /> {actif ? "Désactiver" : "Activer"}
          </DropdownMenuItem>
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive data-[highlighted]:text-destructive"
              >
                <Trash2 className="size-4" /> Supprimer
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le process</DialogTitle>
            <DialogDescription>
              Ce modèle de process sera définitivement supprimé. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
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
