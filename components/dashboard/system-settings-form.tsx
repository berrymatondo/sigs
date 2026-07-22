"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateOtpLoginEnabled } from "@/app/dashboard/parametres/actions"

export function SystemSettingsForm({ otpLoginEnabled }: { otpLoginEnabled: boolean }) {
  const [pending, startTransition] = useTransition()

  function onChange(checked: boolean) {
    startTransition(async () => {
      try {
        await updateOtpLoginEnabled(checked)
        toast.success(checked ? "Vérification OTP activée." : "Vérification OTP désactivée.")
      } catch {
        toast.error("Mise à jour impossible.")
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
      <div className="space-y-1">
        <Label htmlFor="otp-login-enabled">Code de vérification à la connexion</Label>
        <p className="text-sm text-muted-foreground">
          Quand c&apos;est activé, les agents, managers et administrateurs doivent saisir un code à 6
          chiffres reçu par email après leur mot de passe. Les visiteurs ne sont pas concernés.
        </p>
      </div>
      <Switch
        id="otp-login-enabled"
        checked={otpLoginEnabled}
        onCheckedChange={onChange}
        disabled={pending}
      />
    </div>
  )
}
