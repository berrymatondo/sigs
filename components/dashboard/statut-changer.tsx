"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DOSSIER_STATUTS, dossierStatutLabels } from "@/lib/domain"
import { updateDossierStatut } from "@/app/dashboard/dossiers/actions"

export function StatutChanger({ id, statut }: { id: string; statut: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onChange(value: string) {
    startTransition(async () => {
      try {
        await updateDossierStatut(id, value)
        toast.success("Statut mis à jour.")
        router.refresh()
      } catch {
        toast.error("Mise à jour impossible.")
      }
    })
  }

  return (
    <Select value={statut} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DOSSIER_STATUTS.map((s) => (
          <SelectItem key={s} value={s}>
            {dossierStatutLabels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
