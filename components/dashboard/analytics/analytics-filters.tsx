"use client"

import { useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CalendarRange, Layers } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ANALYTICS_PERIODS } from "@/lib/analytics-config"
import { DOSSIER_TYPES, dossierTypeLabels } from "@/lib/domain"

export function AnalyticsFilters({
  period,
  type,
}: {
  period: string
  type: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  // base-ui needs the value→label map to render the selected label when closed.
  const periodItems: Record<string, string> = Object.fromEntries(
    ANALYTICS_PERIODS.map((p) => [p.value, p.label]),
  )
  const typeItems: Record<string, string> = {
    ALL: "Toutes les catégories",
    ...Object.fromEntries(DOSSIER_TYPES.map((t) => [t, dossierTypeLabels[t]])),
  }

  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      data-pending={pending ? "" : undefined}
    >
      <Select items={periodItems} value={period} onValueChange={(v) => setParam("period", String(v))}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <CalendarRange className="size-4 text-muted-foreground" />
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          {ANALYTICS_PERIODS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select items={typeItems} value={type} onValueChange={(v) => setParam("type", String(v))}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <Layers className="size-4 text-muted-foreground" />
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Toutes les catégories</SelectItem>
          {DOSSIER_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {dossierTypeLabels[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
