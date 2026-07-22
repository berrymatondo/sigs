import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProcessSchema } from "@/components/dashboard/process-schema"
import { requireRole } from "@/lib/session"
import { getProcessSchema } from "../../actions"

export default async function ProcessSchemaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(["MANAGER", "ADMIN"])
  const process = await getProcessSchema(id)
  if (!process) notFound()

  return (
    <div>
      <Link
        href={`/dashboard/process/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour au process
      </Link>
      <PageHeader title={`Schéma — ${process.nom}`} description={process.description ?? undefined} />
      <ProcessSchema process={process} />
    </div>
  )
}
