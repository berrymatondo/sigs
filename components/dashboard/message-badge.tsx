import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Always-visible "Messages" affordance for a dossier card: a neutral chip
 * when there's nothing new, switching to a bright gradient pill with the
 * unread count so a waiting reply can't be missed.
 */
export function MessageBadge({ count, className }: { count: number; className?: string }) {
  if (count > 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-linear-to-r from-primary to-primary-to px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm",
          className,
        )}
      >
        <MessageSquare className="size-3.5" />
        {count} nouveau message{count > 1 ? "s" : ""}
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <MessageSquare className="size-3.5" />
      Messages
    </span>
  )
}
