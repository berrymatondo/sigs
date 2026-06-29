import Link from "next/link"
import { Globe2 } from "lucide-react"

export function SiteLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Globe2 className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight">SIGS</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Gestion de Services
        </span>
      </span>
    </Link>
  )
}
