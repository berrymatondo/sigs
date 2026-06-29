"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { createDossier } from "@/app/dashboard/dossiers/actions"
import { DOSSIER_TYPES, dossierTypeLabels, formatClientName, formatDuree, formatUsd } from "@/lib/domain"

type ClientOption = { id: string; nom: string; postnom?: string | null; prenom?: string | null }
type ProcessOption = { id: string; nom: string; dureeJours: number; cout: number }

export function DossierForm({
  clients,
  processes,
  defaultClientId,
  // Staff (agents, managers, admins) pick the client, the process and the
  // amount. Visitors only describe their request: the process and amount are
  // assigned later by an agent when the dossier is taken on.
  isStaff = true,
}: {
  clients: ClientOption[]
  processes: ProcessOption[]
  defaultClientId?: string
  isStaff?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // Base UI's <Select.Value> renders the raw value by default. Providing an
  // `items` map (value -> label) makes it display the human-readable label
  // instead of the underlying id.
  const typeItems = Object.fromEntries(DOSSIER_TYPES.map((t) => [t, dossierTypeLabels[t]]))
  const clientItems = Object.fromEntries(clients.map((c) => [c.id, formatClientName(c)]))
  const processItems = Object.fromEntries(
    processes.map((p) => [p.id, `${p.nom} · ${formatDuree(p.dureeJours)} · ${formatUsd(p.cout)}`]),
  )

  function onSubmit(formData: FormData) {
    const payload = {
      nom: String(formData.get("nom") || "").trim(),
      type: String(formData.get("type") || ""),
      clientId: String(formData.get("clientId") || ""),
      montant: isStaff ? Number(formData.get("montant") || 0) : 0,
      notes: String(formData.get("notes") || ""),
      processDefinitionId: isStaff ? String(formData.get("processDefinitionId") || "") : "",
    }
    if (!payload.nom || !payload.type || (isStaff && !payload.clientId)) {
      toast.error(
        isStaff ? "Nom, type et client sont obligatoires." : "Nom et type sont obligatoires.",
      )
      return
    }
    if (isStaff && !payload.processDefinitionId) {
      toast.error("Veuillez sélectionner un process.")
      return
    }
    startTransition(async () => {
      try {
        const dossier = await createDossier(payload)
        toast.success("Dossier créé avec QR code.")
        router.push(`/dashboard/dossiers/${dossier.id}`)
      } catch {
        toast.error("Création impossible.")
      }
    })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Intitulé du dossier</Label>
            <Input id="nom" name="nom" placeholder="Ex: Visa Schengen - France" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type de service</Label>
              <Select name="type" required items={typeItems}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {DOSSIER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {dossierTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isStaff && (
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <Select name="clientId" defaultValue={defaultClientId} required items={clientItems}>
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Choisir un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {formatClientName(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {isStaff ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="processDefinitionId">Process associé</Label>
                {processes.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    Aucun process actif disponible. Un manager doit d&apos;abord en créer un.
                  </p>
                ) : (
                  <Select name="processDefinitionId" required items={processItems}>
                    <SelectTrigger id="processDefinitionId">
                      <SelectValue placeholder="Choisir un process" />
                    </SelectTrigger>
                    <SelectContent>
                      {processes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom} · {formatDuree(p.dureeJours)} · {formatUsd(p.cout)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Le dossier suivra les étapes définies par ce process.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="montant">Montant (USD)</Label>
                <Input id="montant" name="montant" type="number" min="0" step="1" defaultValue={0} />
              </div>
            </>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Informations complémentaires..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Création..." : "Créer le dossier"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
