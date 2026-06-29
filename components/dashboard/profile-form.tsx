"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateMyProfile } from "@/app/dashboard/profil/actions"

export function ProfileForm({
  defaultName,
  defaultPhone,
  email,
}: {
  defaultName: string
  defaultPhone: string
  email: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onSubmit(formData: FormData) {
    const name = String(formData.get("name") || "").trim()
    if (!name) {
      toast.error("Le nom est requis.")
      return
    }
    startTransition(async () => {
      try {
        await updateMyProfile({ name, phone: String(formData.get("phone") || "") })
        toast.success("Profil mis à jour.")
        router.refresh()
      } catch {
        toast.error("Mise à jour impossible.")
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nom complet</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" name="phone" defaultValue={defaultPhone} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  )
}
