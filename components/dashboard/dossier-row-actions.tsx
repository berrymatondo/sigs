"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Eye, Pencil, CheckCircle2, Trash2 } from "lucide-react"
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
import { clotureDossier, deleteDossier } from "@/app/dashboard/dossiers/actions"

type Confirm = "cloture" | "delete" | null

export function DossierRowActions({
  id,
  numero,
  statut,
  canEdit,
  canClose,
  canDelete,
}: {
  id: string
  numero: string
  statut: string
  canEdit: boolean
  canClose: boolean
  canDelete: boolean
}) {
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const isClosed = statut === "TERMINE" || statut === "ARCHIVE"

  function runCloture() {
    startTransition(async () => {
      try {
        await clotureDossier(id)
        toast.success("Dossier clôturé.")
        setConfirm(null)
        router.refresh()
      } catch {
        toast.error("Clôture impossible.")
      }
    })
  }

  function runDelete() {
    startTransition(async () => {
      try {
        await deleteDossier(id)
        toast.success("Dossier supprimé.")
        setConfirm(null)
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
          render={<Button variant="ghost" size="icon" />}
          aria-label="Actions du dossier"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem render={<Link href={`/dashboard/dossiers/${id}`} />}>
            <Eye className="size-4" /> Consulter
          </DropdownMenuItem>
          {canEdit ? (
            <DropdownMenuItem render={<Link href={`/dashboard/dossiers/${id}?edit=1`} />}>
              <Pencil className="size-4" /> Modifier
            </DropdownMenuItem>
          ) : null}
          {canClose && !isClosed ? (
            <DropdownMenuItem onClick={() => setConfirm("cloture")}>
              <CheckCircle2 className="size-4" /> Clôturer
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirm("delete")}
                className="text-destructive data-[highlighted]:text-destructive"
              >
                <Trash2 className="size-4" /> Supprimer
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "delete" ? "Supprimer le dossier" : "Clôturer le dossier"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "delete"
                ? `Le dossier ${numero} sera définitivement supprimé. Cette action est irréversible.`
                : `Le dossier ${numero} sera marqué comme terminé.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Annuler
            </Button>
            {confirm === "delete" ? (
              <Button variant="destructive" onClick={runDelete} disabled={pending}>
                {pending ? "Suppression..." : "Supprimer"}
              </Button>
            ) : (
              <Button onClick={runCloture} disabled={pending}>
                {pending ? "Clôture..." : "Clôturer"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
