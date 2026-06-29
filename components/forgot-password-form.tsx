"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { resetPasswordByEmail } from "@/app/forgot-password/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteLogo } from "@/components/site-logo"
import { Loader2, MailCheck } from "lucide-react"

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get("email")).trim()

    try {
      await resetPasswordByEmail(email)
      // Always show the same confirmation, whether or not the email exists, to
      // avoid leaking which addresses have an account.
      setSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
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
          <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            {sent
              ? "Vérifiez votre boîte de réception"
              : "Saisissez votre email pour recevoir un nouveau mot de passe"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="size-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Si un compte est associé à cette adresse, vous recevrez un email contenant un
                nouveau mot de passe pour vous connecter. Pensez à le modifier après votre
                connexion.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="vous@exemple.fr"
                  autoComplete="email"
                />
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
                {loading && <Loader2 className="size-4 animate-spin" />}
                Recevoir un nouveau mot de passe
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
