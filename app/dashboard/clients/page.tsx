import Link from "next/link"
import { Eye } from "lucide-react"
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
import { ClientFormDialog } from "@/components/dashboard/client-form-dialog"
import { formatClientName } from "@/lib/domain"
import { getClients } from "./actions"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const clients = await getClients(q)

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Gérez le répertoire de vos clients et leurs dossiers."
        action={<ClientFormDialog />}
      />

      <div className="mb-4">
        <SearchInput placeholder="Rechercher un client..." />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Dossiers</TableHead>
              <TableHead className="w-20 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Aucun client trouvé.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">
                      {formatClientName(c)}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.telephone || "—"}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{c._count.dossiers}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/dashboard/clients/${c.id}`}>
                        <Eye className="size-4" />
                        <span className="sr-only">Voir</span>
                      </Link>
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
