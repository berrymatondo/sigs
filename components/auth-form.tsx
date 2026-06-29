"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { signIn, signUp } from "@/lib/auth-client"
import { sendWelcomeEmailAction } from "@/app/sign-up/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteLogo } from "@/components/site-logo"
import { Loader2, Eye, EyeOff } from "lucide-react"

export function AuthForm({ mode, redirectTo }: { mode: "sign-in" | "sign-up"; redirectTo?: string }) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const isSignUp = mode === "sign-up"
  const destination = redirectTo || "/dashboard"
  const redirectQuery = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""

  // Polls the session endpoint until the auth cookie is readable. signIn/signUp
  // can resolve a tick before the Set-Cookie is fully committed; navigating too
  // early would hit the server without the cookie and bounce back to /sign-in.
  async function waitForSession() {
    for (let attempt = 0; attempt < 12; attempt++) {
      try {
        const res = await fetch("/api/auth/get-session", { credentials: "include" })
        if (res.ok) {
          const body = await res.text()
          if (body && body !== "null") return true
        }
      } catch {
        // ignore and retry
      }
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
    return false
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get("email"))
    const password = String(form.get("password"))

    try {
      if (isSignUp) {
        // Compose the full name from nom (required) + postnom + prénom (optional).
        const nom = String(form.get("nom") ?? "").trim()
        const postnom = String(form.get("postnom") ?? "").trim()
        const prenom = String(form.get("prenom") ?? "").trim()
        const name = [nom, postnom, prenom].filter(Boolean).join(" ")
        const phone = String(form.get("phone") ?? "")
        const { error } = await signUp.email({ email, password, name, phone })
        if (error) throw new Error(error.message)
        // Best-effort welcome email; don't block navigation on its result.
        void sendWelcomeEmailAction({ name, email })
        toast.success("Compte créé avec succès")
      } else {
        const { data, error } = await signIn.email({ email, password })
        if (error) throw new Error(error.message || error.statusText || "Échec connexion")
        toast.success("Connexion réussie")
      }
      // Make sure the session cookie is committed before navigating.
      await waitForSession()
      // Full-page navigation so the freshly set session cookie is sent with the
      // next request.
      window.location.assign(destination)
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
          <CardTitle className="text-2xl">
            {isSignUp ? "Créer un compte" : "Connexion"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Rejoignez SIGS pour suivre vos dossiers en ligne"
              : "Accédez à votre espace personnel"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" name="nom" required placeholder="Kabayi" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="postnom">
                    Postnom <span className="text-muted-foreground">(facultatif)</span>
                  </Label>
                  <Input id="postnom" name="postnom" placeholder="Kabongo" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prenom">
                    Prénom <span className="text-muted-foreground">(facultatif)</span>
                  </Label>
                  <Input id="prenom" name="prenom" placeholder="Jean" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+243 996 018 000" />
                </div>
              </>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="vous@exemple.cd" autoComplete="email" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                {!isSignUp && (
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {isSignUp ? "Créer mon compte" : "Se connecter"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                Déjà un compte ?{" "}
                <Link href={`/sign-in${redirectQuery}`} className="font-medium text-primary hover:underline">
                  Se connecter
                </Link>
              </>
            ) : (
              <>
                Pas encore de compte ?{" "}
                <Link href={`/sign-up${redirectQuery}`} className="font-medium text-primary hover:underline">
                  Créer un compte
                </Link>
              </>
            )}
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:underline">Retour à l'accueil</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
