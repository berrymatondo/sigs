import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatUsd } from "@/lib/domain"

type Row = {
  key: string
  label: string
  total: number
  termines: number
  tauxCompletion: number
  ca: number
  panierMoyen: number
}

export function ReportingTable({
  rows,
  totals,
}: {
  rows: Row[]
  totals: { total: number; termines: number; ca: number; panierMoyen: number }
}) {
  const tauxGlobal =
    totals.total === 0 ? 0 : Math.round((totals.termines / totals.total) * 1000) / 10

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synthèse par catégorie de service</CardTitle>
        <CardDescription>
          Tableau récapitulatif des performances pour le reporting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Dossiers</TableHead>
                <TableHead className="text-right">Finalisés</TableHead>
                <TableHead className="text-right">Taux complétion</TableHead>
                <TableHead className="text-right">Chiffre d&apos;affaires</TableHead>
                <TableHead className="text-right">Panier moyen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Aucune donnée sur cette période.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.termines}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.tauxCompletion}%</TableCell>
                    <TableCell className="text-right tabular-nums">{formatUsd(r.ca)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatUsd(r.panierMoyen)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {rows.length > 0 ? (
              <tfoot>
                <TableRow className="border-t-2 font-semibold hover:bg-transparent">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right tabular-nums">{totals.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{totals.termines}</TableCell>
                  <TableCell className="text-right tabular-nums">{tauxGlobal}%</TableCell>
                  <TableCell className="text-right tabular-nums">{formatUsd(totals.ca)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatUsd(totals.panierMoyen)}</TableCell>
                </TableRow>
              </tfoot>
            ) : null}
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
