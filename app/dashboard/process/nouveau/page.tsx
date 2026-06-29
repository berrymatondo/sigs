import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProcessBuilder } from "@/components/dashboard/process-builder"
import { requireRole } from "@/lib/session"

export default async function NouveauProcessPage() {
  await requireRole(["MANAGER", "ADMIN"])

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/process"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux process
      </Link>
      <PageHeader
        title="Nouveau process"
        description="Définissez les étapes et sous-étapes du process, sa durée et son coût."
      />
      <ProcessBuilder />
    </div>
  )
}
