import Link from "next/link"
import { FileText, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { SearchInput } from "@/components/dashboard/search-input"
import { requireRole } from "@/lib/session"
import { formatClientName } from "@/lib/domain"
import { getDocuments } from "./actions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireRole(["AGENT", "MANAGER", "ADMIN"])
  const { q } = await searchParams
  const documents = await getDocuments(q)

  return (
    <div>
      <PageHeader title="Documents" description="Tous les documents rattachés aux dossiers." />

      <div className="mb-4">
        <SearchInput placeholder="Rechercher un document..." />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Dossier</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Ajouté le</TableHead>
              <TableHead className="w-16 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Aucun document.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="font-medium">{doc.titre}</span>
                      <span className="text-xs text-muted-foreground">{doc.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {doc.dossier ? (
                      <Link href={`/dashboard/dossiers/${doc.dossierId}`} className="hover:underline">
                        {doc.dossier.numero}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(() => {
                      const c = doc.dossier?.client ?? doc.client
                      return c ? formatClientName(c) : "—"
                    })()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(doc.createdAt, "d MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <a href={`/api/documents/file?pathname=${encodeURIComponent(doc.fichier)}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                        <span className="sr-only">Ouvrir</span>
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
