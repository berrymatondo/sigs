"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  MessageSquare,
  Folder,
  Paperclip,
  Info,
} from "lucide-react"
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
          <div key={si} className="flex items-start gap-4">
            {/* Timeline: numbered circle + dashed connector down to the next step */}
            <div className="flex shrink-0 flex-col items-center self-stretch">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-to text-base font-bold text-primary-foreground shadow-md">
                {si + 1}
              </span>
              {si < steps.length - 1 && (
                <span className="mt-1 w-px flex-1 border-l-2 border-dashed border-primary/30" />
              )}
            </div>

            <Card className="mb-4 flex-1 overflow-hidden">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <Input
                    value={step.nom}
                    onChange={(e) => updateStep(si, { nom: e.target.value })}
                    placeholder={`Nom de l'étape ${si + 1}`}
                    disabled={readOnly}
                    className="border-none bg-transparent px-0 text-lg font-bold shadow-none focus-visible:ring-0 disabled:opacity-100"
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    {!readOnly && (
                      <>
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
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => updateStep(si, { collapsed: !step.collapsed })}
                    >
                      {step.collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                      <span className="sr-only">{step.collapsed ? "Déplier" : "Replier"}</span>
                    </Button>
                  </div>
                </div>

                <div className="flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Calendar className="size-3.5" />
                  Durée estimée :
                  <input
                    type="number"
                    min={0}
                    value={step.dureeJours}
                    onChange={(e) => updateStep(si, { dureeJours: Number(e.target.value) })}
                    disabled={readOnly}
                    className="w-10 border-none bg-transparent p-0 text-xs font-semibold text-primary focus:outline-none disabled:opacity-100"
                  />
                  jour{step.dureeJours > 1 ? "s" : ""}
                </div>

                {!step.collapsed && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border bg-primary/5 p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <FileText className="size-4" /> Description
                        </div>
                        <Textarea
                          rows={3}
                          value={step.description}
                          onChange={(e) => updateStep(si, { description: e.target.value })}
                          disabled={readOnly}
                          className="mt-2 border-none bg-transparent p-0 shadow-none focus-visible:ring-0 disabled:opacity-100"
                        />
                      </div>
                      <div className="rounded-lg border bg-primary/5 p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <MessageSquare className="size-4" /> Commentaire
                        </div>
                        <Textarea
                          rows={3}
                          value={step.commentaire}
                          onChange={(e) => updateStep(si, { commentaire: e.target.value })}
                          placeholder="Ajouter un commentaire..."
                          disabled={readOnly}
                          className="mt-2 border-none bg-transparent p-0 shadow-none focus-visible:ring-0 disabled:opacity-100"
                        />
                      </div>
                    </div>

                    {/* Sub-steps */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Sous-étapes ({step.subSteps.length})
                        </Label>
                        {!readOnly && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => addSubStep(si)}>
                            <Plus className="size-3.5" /> Sous-étape
                          </Button>
                        )}
                      </div>
                      {step.subSteps.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucune sous-étape.</p>
                      ) : (
                        step.subSteps.map((sub, ji) => (
                          <div key={ji} className="rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                                {si + 1}.{ji + 1}
                              </span>
                              <Folder className="size-4 shrink-0 text-primary" />
                              <Input
                                value={sub.nom}
                                onChange={(e) => updateSubStep(si, ji, { nom: e.target.value })}
                                placeholder="Nom de la sous-étape"
                                disabled={readOnly}
                                className="h-8"
                              />
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                <Paperclip className="size-3" /> Documents requis
                              </span>
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
                            <div className="mt-2 pl-9">
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

                    <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
                      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                      <p>
                        <span className="font-semibold text-primary">À savoir</span> — assurez-vous que les
                        informations de cette étape sont complètes et à jour avant de l&apos;utiliser dans un
                        dossier.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
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
