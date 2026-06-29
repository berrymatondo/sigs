"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import {
  TACHE_PRIORITES,
  TACHE_STATUTS,
  prioriteLabels,
  tacheStatutLabels,
  roleLabels,
} from "@/lib/domain"
import { createTache, updateTache } from "@/app/dashboard/taches/actions"

export type TacheData = {
  id: string
  titre: string
  description: string | null
  priorite: string
  statut: string
  dateEcheance: Date | string | null
  dossierId: string
  agentId?: string | null
}

type DossierOption = { id: string; numero: string; nom: string }
type UserOption = { id: string; name: string; email: string; role: string }

const UNASSIGNED = "__none__"

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

export function TacheFormDialog({
  mode,
  tache,
  dossiers = [],
  assignableUsers = [],
  canAssign = false,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  mode: "create" | "edit"
  tache?: TacheData
  dossiers?: DossierOption[]
  assignableUsers?: UserOption[]
  canAssign?: boolean
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = (o: boolean) => {
    if (!isControlled) setUncontrolledOpen(o)
    onOpenChange?.(o)
  }
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onSubmit(formData: FormData) {
    const titre = String(formData.get("titre") || "").trim()
    if (!titre) {
      toast.error("Le titre est requis.")
      return
    }
    const priorite = String(formData.get("priorite") || "NORMALE")
    const description = String(formData.get("description") || "")
    const dateEcheance = String(formData.get("dateEcheance") || "")

    startTransition(async () => {
      try {
        if (mode === "create") {
          const dossierId = String(formData.get("dossierId") || "")
          if (!dossierId) {
            toast.error("Veuillez sélectionner un dossier.")
            return
          }
          await createTache({ titre, description, priorite, dateEcheance, dossierId })
          toast.success("Tâche créée.")
        } else if (tache) {
          const statut = String(formData.get("statut") || tache.statut)
          const rawAgent = canAssign ? String(formData.get("agentId") || "") : ""
          const agentId = canAssign
            ? rawAgent === UNASSIGNED || rawAgent === ""
              ? null
              : rawAgent
            : undefined
          await updateTache(tache.id, { titre, description, priorite, statut, dateEcheance, agentId })
          toast.success("Tâche mise à jour.")
        }
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Opération impossible.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvelle tâche" : "Modifier la tâche"}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="dossierId">Dossier</Label>
              <Select name="dossierId" defaultValue={tache?.dossierId}>
                <SelectTrigger id="dossierId">
                  <SelectValue placeholder="Choisir un dossier" />
                </SelectTrigger>
                <SelectContent>
                  {dossiers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.numero} — {d.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              name="titre"
              defaultValue={tache?.titre}
              placeholder="Ex: Vérifier les pièces justificatives"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={tache?.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priorite">Priorité</Label>
              <Select name="priorite" defaultValue={tache?.priorite ?? "NORMALE"}>
                <SelectTrigger id="priorite">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TACHE_PRIORITES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {prioriteLabels[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEcheance">Échéance</Label>
              <Input
                id="dateEcheance"
                name="dateEcheance"
                type="date"
                defaultValue={toDateInput(tache?.dateEcheance)}
              />
            </div>
          </div>
          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select name="statut" defaultValue={tache?.statut ?? "A_FAIRE"}>
                <SelectTrigger id="statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TACHE_STATUTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tacheStatutLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {mode === "edit" && canAssign && (
            <div className="space-y-2">
              <Label htmlFor="agentId">Assigné à</Label>
              <Select name="agentId" defaultValue={tache?.agentId ?? UNASSIGNED}>
                <SelectTrigger id="agentId">
                  <SelectValue placeholder="Choisir un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Non assignée</SelectItem>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {roleLabels[u.role as keyof typeof roleLabels] ?? u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Enregistrement..."
                : mode === "create"
                  ? "Créer la tâche"
                  : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
