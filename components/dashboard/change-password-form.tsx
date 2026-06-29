"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword } from "@/lib/auth-client"

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition()
  const [show, setShow] = useState(false)

  function onSubmit(formData: FormData) {
    const currentPassword = String(formData.get("currentPassword") || "")
    const newPassword = String(formData.get("newPassword") || "")
    const confirmPassword = String(formData.get("confirmPassword") || "")

    if (!currentPassword || !newPassword) {
      toast.error("Veuillez remplir tous les champs.")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }

    startTransition(async () => {
      const { error } = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (error) {
        toast.error(
          error.message === "Invalid password"
            ? "Le mot de passe actuel est incorrect."
            : "Modification impossible. Vérifiez votre mot de passe actuel.",
        )
        return
      }
      toast.success("Mot de passe mis à jour.")
      const form = document.getElementById("change-password-form") as HTMLFormElement | null
      form?.reset()
    })
  }

  return (
    <form id="change-password-form" action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center rounded-md pr-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={show ? "Masquer les mots de passe" : "Afficher les mots de passe"}
            aria-pressed={show}
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Au moins 8 caractères.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Modification..." : "Modifier le mot de passe"}
      </Button>
    </form>
  )
}
