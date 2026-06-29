"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  createProcessDefinition,
  updateProcessDefinition,
  type ProcessInput,
} from "@/app/dashboard/process/actions"

type SubStepDraft = { nom: string; documentsRequis: string[] }
type StepDraft = {
  nom: string
  dureeJours: number
  description: string
  commentaire: string
  subSteps: SubStepDraft[]
  collapsed?: boolean
}

export type ProcessDraft = {
  id?: string
  nom: string
  description: string
  dureeJours: number
  cout: number
  actif: boolean
  steps: StepDraft[]
}

function emptyStep(): StepDraft {
  return { nom: "", dureeJours: 0, description: "", commentaire: "", subSteps: [] }
}

export function ProcessBuilder({
  initial,
  readOnly = false,
}: {
  initial?: ProcessDraft
  readOnly?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [nom, setNom] = useState(initial?.nom ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [dureeJours, setDureeJours] = useState(initial?.dureeJours ?? 0)
  const [cout, setCout] = useState(initial?.cout ?? 0)
  const [actif, setActif] = useState(initial?.actif ?? true)
  const [steps, setSteps] = useState<StepDraft[]>(
    initial?.steps?.length ? initial.steps : [emptyStep()],
  )

  function updateStep(i: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }
  function addStep() {
    setSteps((prev) => [...prev, emptyStep()])
  }
  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i))
  }
  function moveStep(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }
  function addSubStep(si: number) {
    setSteps((prev) =>
      prev.map((s, idx) =>
        idx === si ? { ...s, subSteps: [...s.subSteps, { nom: "", documentsRequis: [] }] } : s,
      ),
    )
  }
  function updateSubStep(si: number, ji: number, patch: Partial<SubStepDraft>) {
    setSteps((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? { ...s, subSteps: s.subSteps.map((sub, j) => (j === ji ? { ...sub, ...patch } : sub)) }
          : s,
      ),
    )
  }
  function removeSubStep(si: number, ji: number) {
    setSteps((prev) =>
      prev.map((s, idx) =>
        idx === si ? { ...s, subSteps: s.subSteps.filter((_, j) => j !== ji) } : s,
      ),
    )
  }

  function handleSubmit() {
    if (!nom.trim()) {
      toast.error("Le nom du process est obligatoire.")
      return
    }
    if (steps.length === 0 || steps.some((s) => !s.nom.trim())) {
      toast.error("Chaque étape doit avoir un nom.")
      return
    }
    const payload: ProcessInput = {
      nom: nom.trim(),
      description: description.trim(),
      dureeJours: Number(dureeJours) || 0,
      cout: Number(cout) || 0,
      actif,
      steps: steps.map((s) => ({
        nom: s.nom.trim(),
        dureeJours: Number(s.dureeJours) || 0,
        description: s.description.trim(),
        commentaire: s.commentaire.trim(),
        subSteps: s.subSteps
          .filter((sub) => sub.nom.trim())
          .map((sub) => ({
            nom: sub.nom.trim(),
            documentsRequis: sub.documentsRequis.map((d) => d.trim()).filter(Boolean),
          })),
      })),
    }
    startTransition(async () => {
      try {
        if (initial?.id) {
          await updateProcessDefinition(initial.id, payload)
          toast.success("Process mis à jour.")
          router.push("/dashboard/process")
        } else {
          await createProcessDefinition(payload)
          toast.success("Process créé.")
          router.push("/dashboard/process")
        }
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Enregistrement impossible.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* General info */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="p-nom">Nom du process</Label>
            <Input
              id="p-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Demande de visa Schengen"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Décrivez l'objectif de ce process..."
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-duree">Durée approximative (jours)</Label>
              <Input
                id="p-duree"
                type="number"
                min={0}
                value={dureeJours}
                onChange={(e) => setDureeJours(Number(e.target.value))}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-cout">Coût (USD)</Label>
              <Input
                id="p-cout"
                type="number"
                min={0}
                step="1"
                value={cout}
                onChange={(e) => setCout(Number(e.target.value))}
                disabled={readOnly}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={actif}
              onChange={(e) => setActif(e.target.checked)}
              disabled={readOnly}
              className="size-4 rounded border-input"
            />
            Process actif (proposé à la création des dossiers)
          </label>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Étapes ({steps.length})</h2>
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="size-4" /> Ajouter une étape
            </Button>
          )}
        </div>

        {steps.map((step, si) => (
          <Card key={si} className="overflow-hidden">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {si + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <Input
                    value={step.nom}
                    onChange={(e) => updateStep(si, { nom: e.target.value })}
                    placeholder={`Nom de l'étape ${si + 1}`}
                    disabled={readOnly}
                    className="font-medium"
                  />
                </div>
                {!readOnly && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveStep(si, -1)}
                      disabled={si === 0}
                    >
                      <ChevronUp className="size-4" />
                      <span className="sr-only">Monter</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveStep(si, 1)}
                      disabled={si === steps.length - 1}
                    >
                      <ChevronDown className="size-4" />
                      <span className="sr-only">Descendre</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(si)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Supprimer l'étape</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-3 pl-10 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Durée (jours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={step.dureeJours}
                    onChange={(e) => updateStep(si, { dureeJours: Number(e.target.value) })}
                    disabled={readOnly}
                  />
                </div>
              </div>
              <div className="grid gap-3 pl-10 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    rows={2}
                    value={step.description}
                    onChange={(e) => updateStep(si, { description: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Commentaire</Label>
                  <Textarea
                    rows={2}
                    value={step.commentaire}
                    onChange={(e) => updateStep(si, { commentaire: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Sub-steps */}
              <div className="space-y-2 pl-10">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sous-étapes ({step.subSteps.length})
                  </Label>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addSubStep(si)}
                    >
                      <Plus className="size-3.5" /> Sous-étape
                    </Button>
                  )}
                </div>
                {step.subSteps.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune sous-étape.</p>
                ) : (
                  step.subSteps.map((sub, ji) => (
                    <div key={ji} className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {si + 1}.{ji + 1}
                        </span>
                        <Input
                          value={sub.nom}
                          onChange={(e) => updateSubStep(si, ji, { nom: e.target.value })}
                          placeholder="Nom de la sous-étape"
                          disabled={readOnly}
                          className="h-8"
                        />
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubStep(si, ji)}
                            className="size-8 shrink-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Supprimer la sous-étape</span>
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 pl-6">
                        <Label className="text-xs text-muted-foreground">
                          Documents à attacher (séparés par des virgules)
                        </Label>
                        <Input
                          value={sub.documentsRequis.join(", ")}
                          onChange={(e) =>
                            updateSubStep(si, ji, {
                              documentsRequis: e.target.value.split(",").map((d) => d.trimStart()),
                            })
                          }
                          placeholder="Ex: Passeport, Photo d'identité"
                          disabled={readOnly}
                          className="mt-1 h-8"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending ? "Enregistrement..." : initial?.id ? "Mettre à jour le process" : "Créer le process"}
          </Button>
        </div>
      )}
    </div>
  )
}
