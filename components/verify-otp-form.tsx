"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { submitLoginOtp, resendLoginOtp, cancelLoginOtp } from "@/app/verify-otp/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteLogo } from "@/components/site-logo"
import { Loader2, ShieldCheck } from "lucide-react"

export function VerifyOtpForm({ email }: { email: string }) {
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const result = await submitLoginOtp(null, form)
      if (result?.ok) {
        toast.success("Connexion confirmée")
        window.location.assign("/dashboard")
        return
      }
      toast.error(result?.message ?? "Code incorrect.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      const result = await resendLoginOtp()
      toast.success(result.ok ? "Nouveau code envoyé." : "Nouveau code généré.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setResending(false)
    }
  }

  async function handleCancel() {
    await cancelLoginOtp()
    router.push("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-6">
        <SiteLogo />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Vérification en deux étapes</CardTitle>
          <CardDescription>
            Un code à 6 chiffres a été envoyé à <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Code de vérification</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                placeholder="000000"
                className="text-center text-lg tracking-[0.5em]"
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Confirmer
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resending ? "Envoi..." : "Renvoyer le code"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
