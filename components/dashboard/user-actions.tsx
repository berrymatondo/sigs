"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Ban, ShieldCheck, Trash2, Pencil, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { UserFormDialog } from "@/components/dashboard/user-form-dialog"
import type { AppRole } from "@/lib/auth"
import { toggleUserBan, deleteUser, resetUserPassword } from "@/app/dashboard/administration/actions"

export function UserActions({
  id,
  banned,
  disabled,
  user,
}: {
  id: string
  banned: boolean
  disabled?: boolean
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    role: AppRole
  }
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onResetPassword() {
    startTransition(async () => {
      try {
        const result = await resetUserPassword(id, newPassword || undefined)
        toast.success(
          result?.emailSent
            ? "Mot de passe réinitialisé. Le nouveau mot de passe a été envoyé par email."
            : "Mot de passe réinitialisé. (Email non envoyé : vérifiez la configuration Resend.)",
        )
        setResetOpen(false)
        setNewPassword("")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Réinitialisation impossible.")
      }
    })
  }

  function onToggleBan() {
    startTransition(async () => {
      try {
        const nowBanned = await toggleUserBan(id)
        toast.success(nowBanned ? "Compte suspendu." : "Compte réactivé.")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action impossible.")
      }
    })
  }

  function onDelete() {
    startTransition(async () => {
      try {
        await deleteUser(id)
        toast.success("Utilisateur supprimé.")
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
          render={
            <Button variant="ghost" size="icon" disabled={disabled || pending}>
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetOpen(true)}>
            <KeyRound className="size-4" /> Réinitialiser le mot de passe
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleBan}>
            {banned ? (
              <>
                <ShieldCheck className="size-4" /> Réactiver le compte
              </>
            ) : (
              <>
                <Ban className="size-4" /> Suspendre le compte
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setConfirmDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserFormDialog mode="edit" user={user} open={editOpen} onOpenChange={setEditOpen} />

      <Dialog
        open={resetOpen}
        onOpenChange={(open) => {
          setResetOpen(open)
          if (!open) setNewPassword("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Définissez un nouveau mot de passe pour {user.name}, ou laissez le champ vide pour en
              générer un automatiquement. Le nouveau mot de passe sera envoyé par email à l&apos;utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`reset-password-${id}`}>Nouveau mot de passe (optionnel)</Label>
            <Input
              id={`reset-password-${id}`}
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Laisser vide pour en générer un automatiquement"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button onClick={onResetPassword} disabled={pending}>
              {pending ? "Réinitialisation..." : "Réinitialiser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cet utilisateur ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le compte et ses accès seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={pending}>
              {pending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
