import { cn } from "@/lib/utils"
import {
  dossierStatutColors,
  dossierStatutLabels,
  prioriteColors,
  prioriteLabels,
} from "@/lib/domain"

export function StatutBadge({ statut }: { statut: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        dossierStatutColors[statut] ?? "bg-muted text-muted-foreground",
      )}
    >
      {dossierStatutLabels[statut] ?? statut}
    </span>
  )
}

export function PrioriteBadge({ priorite }: { priorite: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        prioriteColors[priorite] ?? "bg-muted text-muted-foreground",
      )}
    >
      {prioriteLabels[priorite] ?? priorite}
    </span>
  )
}
