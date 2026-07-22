import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Compact "at a glance" stepper: one dot per step, connected by a line.
 * Done steps are filled with a check, the current step is highlighted, the
 * rest stay muted. `etapeActuelle` is 0-based (index of the step being
 * worked on); a closed dossier shows every step as done.
 */
export function MiniStepper({
  totalSteps,
  etapeActuelle,
  isClosed,
  className,
  fullWidth,
}: {
  totalSteps: number
  etapeActuelle: number
  isClosed: boolean
  className?: string
  /** Stretches the connector lines to fill the container instead of hugging the left edge. */
  fullWidth?: boolean
}) {
  if (totalSteps === 0) return null

  return (
    <div className={cn("flex items-center", fullWidth && "w-full", className)}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const done = isClosed || i < etapeActuelle
        const current = !isClosed && i === etapeActuelle
        return (
          <div key={i} className={cn("flex items-center", fullWidth ? "flex-1 last:flex-none" : "last:flex-none")}>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-offset-2 ring-offset-background",
                done
                  ? "bg-emerald-600 text-white ring-emerald-600"
                  : current
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-muted text-muted-foreground ring-transparent",
              )}
              title={`Étape ${i + 1}${current ? " (en cours)" : done ? " (validée)" : ""}`}
            >
              {done ? <Check className="size-3" /> : i + 1}
            </span>
            {i < totalSteps - 1 ? (
              <span
                className={cn(
                  "h-0.5 shrink-0",
                  fullWidth ? "flex-1 mx-1" : "w-4 sm:w-6",
                  done ? "bg-emerald-600" : "bg-muted",
                )}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
