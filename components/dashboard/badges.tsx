import { cn } from "@/lib/utils"
import {
  dossierStatutColors,
  dossierStatutLabels,
  dossierStatutIcons,
  dossierTypeColors,
  dossierTypeIcons,
  dossierTypeLabels,
  prioriteColors,
  prioriteLabels,
} from "@/lib/domain"

export function StatutBadge({ statut }: { statut: string }) {
  const Icon = dossierStatutIcons[statut]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        dossierStatutColors[statut] ?? "bg-muted text-muted-foreground",
      )}
    >
      {Icon ? <Icon className="size-3" /> : null}
      {dossierStatutLabels[statut] ?? statut}
    </span>
  )
}

export function DossierTypeBadge({ type }: { type: string }) {
  const Icon = dossierTypeIcons[type]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        dossierTypeColors[type] ?? "bg-muted text-muted-foreground",
      )}
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {dossierTypeLabels[type] ?? type}
    </span>
  )
}

export function DossierTypeIconTile({ type, className }: { type: string; className?: string }) {
  const Icon = dossierTypeIcons[type]
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        dossierTypeColors[type] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {Icon ? <Icon className="size-5" /> : null}
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
