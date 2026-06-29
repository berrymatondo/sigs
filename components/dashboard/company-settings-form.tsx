"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, MessageCircle, Mail, MapPin, Clock, Save } from "lucide-react"
import { updateCompanySettings, type SettingsState } from "@/app/dashboard/parametres/actions"
import type { CompanySettings } from "@/lib/company-settings"

const fields = [
  { name: "telephone", label: "Téléphone", icon: Phone, type: "text", placeholder: "+243 81 234 56 78" },
  { name: "whatsapp", label: "WhatsApp", icon: MessageCircle, type: "text", placeholder: "+243 99 876 54 32" },
  { name: "email", label: "Email", icon: Mail, type: "email", placeholder: "contact@sigs-agence.cd" },
  { name: "adresse", label: "Adresse", icon: MapPin, type: "text", placeholder: "Boulevard du 30 Juin, Gombe, Kinshasa" },
  { name: "horaires", label: "Horaires", icon: Clock, type: "text", placeholder: "Lun - Ven, 9h - 18h" },
] as const

export function CompanySettingsForm({ settings }: { settings: CompanySettings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateCompanySettings, null)

  useEffect(() => {
    if (state?.ok) toast.success(state.message)
    else if (state && !state.ok) toast.error(state.message)
  }, [state])

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className="flex flex-col gap-2">
            <Label htmlFor={f.name} className="flex items-center gap-2">
              <f.icon className="size-4 text-primary" aria-hidden />
              {f.label}
            </Label>
            <Input
              id={f.name}
              name={f.name}
              type={f.type}
              required
              defaultValue={settings[f.name]}
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        <Save className="size-4" />
        {pending ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
    </form>
  )
}
