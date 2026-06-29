import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "text-primary",
}: {
  label: string
  value: number | string
  icon: LucideIcon
  accent?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-lg bg-secondary">
          <Icon className={`size-5 ${accent}`} />
        </div>
      </CardContent>
    </Card>
  )
}
