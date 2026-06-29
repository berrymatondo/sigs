"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DOSSIER_STATUTS, dossierStatutLabels } from "@/lib/domain"

export function StatutFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("statut") ?? "ALL"

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "ALL") params.delete("statut")
    else params.set("statut", value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-52">
        <SelectValue placeholder="Tous les statuts" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Tous les statuts</SelectItem>
        {DOSSIER_STATUTS.map((s) => (
          <SelectItem key={s} value={s}>
            {dossierStatutLabels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
