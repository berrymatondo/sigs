import { History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatutBadge } from "@/components/dashboard/badges"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

type HistoryEntry = {
  id: string
  ancienStatut: string | null
  nouveauStatut: string
  userName: string | null
  createdAt: Date
}

export function StatutHistory({ entries }: { entries: HistoryEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4 text-muted-foreground" />
          Historique des statuts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun changement de statut enregistré.
          </p>
        ) : (
          <ol className="relative space-y-5 border-l border-border pl-6">
            {entries.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  className="absolute -left-[1.6875rem] top-1 size-3 rounded-full border-2 border-background bg-primary"
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-2">
                  {entry.ancienStatut ? (
                    <>
                      <StatutBadge statut={entry.ancienStatut} />
                      <span className="text-muted-foreground" aria-hidden>
                        &rarr;
                      </span>
                      <StatutBadge statut={entry.nouveauStatut} />
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">Création</span>
                      <StatutBadge statut={entry.nouveauStatut} />
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(entry.createdAt, "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  {entry.userName ? ` · par ${entry.userName}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
