import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaSuffix = "%",
  showDelta = true,
  positiveIsGood = true,
  hint,
}: {
  label: string
  value: string
  icon: LucideIcon
  delta?: number
  deltaSuffix?: string
  showDelta?: boolean
  positiveIsGood?: boolean
  hint?: string
}) {
  const hasDelta = showDelta && typeof delta === "number"
  const isUp = (delta ?? 0) > 0
  const isFlat = (delta ?? 0) === 0
  const good = isFlat ? null : isUp === positiveIsGood
  const TrendIcon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
            <Icon className="size-4 text-primary" />
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          {hasDelta ? (
            <span
              className={cn(
                "mb-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
                good === null && "bg-muted text-muted-foreground",
                good === true && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                good === false && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
              )}
            >
              <TrendIcon className="size-3" />
              {isUp ? "+" : ""}
              {delta}
              {deltaSuffix}
            </span>
          ) : hint ? (
            <span className="mb-1 text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
