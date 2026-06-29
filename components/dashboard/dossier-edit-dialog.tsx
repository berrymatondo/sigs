"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DOSSIER_TYPES, dossierTypeLabels, roleLabels, formatDuree, formatUsd } from "@/lib/domain"
import { updateDossier } from "@/app/dashboard/dossiers/actions"

type AgentOption = { id: string; name: string | null; email: string; role: string }
type ProcessOption = { id: string; nom: string; dureeJours: number; cout: number }

const UNASSIGNED = "__none__"

export function DossierEditDialog({
  dossier,
  agents,
  processes,
  defaultOpen = false,
}: {
  dossier: {
    id: string
    nom: string
    type: string
    montant: number
    notes: string | null
    agentId: string | null
    processDefinitionId: string | null
    processName: string | null
  }
  agents: AgentOption[]
  processes: ProcessOption[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const hasProcess = Boolean(dossier.processDefinitionId)

  // base-ui needs a value→label map so the trigger shows the label (not the id)
  // once a value is selected.
  const typeItems: Record<string, string> = Object.fromEntries(
    DOSSIER_TYPES.map((t) => [t, dossierTypeLabels[t]]),
  )
  const agentItems: Record<string, string> = {
    [UNASSIGNED]: "Non assigné",
    ...Object.fromEntries(
      agents.map((a) => [a.id, `${a.name || a.email} — ${roleLabels[a.role] ?? a.role}`]),
    ),
  }
  const processItems: Record<string, string> = {
    [UNASSIGNED]: "Aucun pour l'instant",
    ...Object.fromEntries(
      processes.map((p) => [p.id, `${p.nom} · ${formatDuree(p.dureeJours)} · ${formatUsd(p.cout)}`]),
    ),
  }

  function onSubmit(formData: FormData) {
    const nom = String(formData.get("nom") || "").trim()
    const type = String(formData.get("type") || "")
    const montant = Number(formData.get("montant") || 0)
    const notes = String(formData.get("notes") || "")
    const agentValue = String(formData.get("agentId") || UNASSIGNED)
    const processValue = String(formData.get("processDefinitionId") || UNASSIGNED)
    if (!nom || !type) {
      toast.error("L'intitulé et le type sont obligatoires.")
      return
    }
    startTransition(async () => {
      try {
        await updateDossier(dossier.id, {
          nom,
          type,
          montant,
          notes,
          agentId: agentValue === UNASSIGNED ? null : agentValue,
          // A process can only be attached when none exists yet.
          ...(!hasProcess && processValue !== UNASSIGNED
            ? { processDefinitionId: processValue }
            : {}),
        })
        toast.success("Dossier mis à jour.")
        setOpen(false)
        router.refresh()
      } catch {
        toast.error("Modification impossible.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil className="size-4" /> Modifier
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le dossier</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nom">Intitulé du dossier</Label>
            <Input id="edit-nom" name="nom" defaultValue={dossier.nom} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type de service</Label>
              <Select name="type" items={typeItems} defaultValue={dossier.type}>
                <SelectTrigger id="edit-type">
                  <SelectValue />
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
            <div className="space-y-2">
              <Label htmlFor="edit-montant">Montant (USD)</Label>
              <Input
                id="edit-montant"
                name="montant"
                type="number"
                min="0"
                step="1"
                defaultValue={dossier.montant}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-agent">Agent assigné</Label>
            <Select name="agentId" items={agentItems} defaultValue={dossier.agentId ?? UNASSIGNED}>
              <SelectTrigger id="edit-agent">
                <SelectValue placeholder="Choisir un agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Non assigné</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name || a.email} — {roleLabels[a.role] ?? a.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-process">Process associé</Label>
            {hasProcess ? (
              <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                {dossier.processName ?? "Process"} — déjà associé (non modifiable).
              </p>
            ) : processes.length === 0 ? (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Aucun process actif. Un manager doit d&apos;abord en créer un.
              </p>
            ) : (
              <>
                <Select name="processDefinitionId" items={processItems} defaultValue={UNASSIGNED}>
                  <SelectTrigger id="edit-process">
                    <SelectValue placeholder="Choisir un process" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Aucun pour l&apos;instant</SelectItem>
                    {processes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom} · {formatDuree(p.dureeJours)} · {formatUsd(p.cout)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  À définir lors de la prise en charge du dossier.
                </p>
              </>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" name="notes" rows={3} defaultValue={dossier.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
