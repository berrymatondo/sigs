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
import { TACHE_STATUTS, tacheStatutLabels } from "@/lib/domain"
import { updateTacheStatut } from "@/app/dashboard/taches/actions"

export function TacheStatutSelect({ id, statut }: { id: string; statut: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onChange(value: string) {
    startTransition(async () => {
      try {
        await updateTacheStatut(id, value)
        toast.success("Tâche mise à jour.")
        router.refresh()
      } catch {
        toast.error("Mise à jour impossible.")
      }
    })
  }

  return (
    <Select value={statut} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-8 w-36 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TACHE_STATUTS.map((s) => (
          <SelectItem key={s} value={s}>
            {tacheStatutLabels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
