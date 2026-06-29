"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { resetPassword } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteLogo } from "@/components/site-logo"
import { Loader2 } from "lucide-react"

export function ResetPasswordForm({ token, tokenError }: { token?: string; tokenError?: string }) {
  const [loading, setLoading] = useState(false)

  const invalidToken = !token || Boolean(tokenError)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token) return
    const form = new FormData(e.currentTarget)
    const password = String(form.get("password"))
    const confirm = String(form.get("confirm"))

    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    try {
      const { error } = await resetPassword({ newPassword: password, token })
      if (error) throw new Error(error.message)
      toast.success("Mot de passe réinitialisé. Vous pouvez vous connecter.")
      window.location.assign("/sign-in")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-6">
        <SiteLogo />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <CardDescription>
            {invalidToken
              ? "Ce lien est invalide ou a expiré"
              : "Choisissez un nouveau mot de passe pour votre compte"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invalidToken ? (
            <p className="text-center text-sm text-muted-foreground">
              Le lien de réinitialisation n&apos;est plus valide. Veuillez en demander un nouveau.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
                {loading && <Loader2 className="size-4 animate-spin" />}
                Réinitialiser le mot de passe
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {invalidToken ? (
              <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                Demander un nouveau lien
              </Link>
            ) : (
              <Link href="/sign-in" className="font-medium text-primary hover:underline">
                Retour à la connexion
              </Link>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
