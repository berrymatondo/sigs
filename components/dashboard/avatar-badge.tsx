import Image from "next/image"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials, avatarColor } from "@/lib/domain"

export function AvatarBadge({
  name,
  image,
  size = "size-9",
}: {
  name?: string | null
  image?: string | null
  size?: string
}) {
  if (!name) {
    return (
      <span
        className={cn(
          size,
          "flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground",
        )}
      >
        <User className="size-4" />
      </span>
    )
  }
  if (image) {
    return (
      <span className={cn(size, "relative shrink-0 overflow-hidden rounded-full border border-border")}>
        <Image src={image} alt={name} fill className="object-cover" />
      </span>
    )
  }
  return (
    <span
      className={cn(
        size,
        "flex shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        avatarColor(name),
      )}
    >
      {getInitials(name)}
    </span>
  )
}
