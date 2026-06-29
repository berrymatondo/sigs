"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  FileText,
  Download,
  Paperclip,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { formatDuree } from "@/lib/domain"
import { DownloadButton } from "@/components/dashboard/download-button"
import { toggleSubStep, validateStep } from "@/app/dashboard/dossiers/process-actions"
import { createDocument } from "@/app/dashboard/documents/actions"

type DocItem = { id: string; titre: string; type: string; fichier: string }
type SubStepItem = {
  id: string
  ordre: number
  nom: string
  documentsRequis: string[]
  coche: boolean
  documents: DocItem[]
}
type StepItem = {
  id: string
  ordre: number
  nom: string
  dureeJours: number
  description: string | null
  commentaire: string | null
  valide: boolean
  subStepStates: SubStepItem[]
}

function extToType(name: string) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return "PDF"
  if (ext === "doc" || ext === "docx") return "WORD"
  if (ext === "xls" || ext === "xlsx") return "EXCEL"
  if (ext === "jpg" || ext === "jpeg") return "JPEG"
  if (ext === "png") return "PNG"
  return "AUTRE"
}

function SubStepRow({
  sub,
  dossierId,
  editable,
  canDownload,
}: {
  sub: SubStepItem
  dossierId: string
  editable: boolean
  canDownload: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function onToggle(checked: boolean) {
    startTransition(async () => {
      try {
        await toggleSubStep(sub.id, checked)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action impossible.")
      }
    })
  }

  function onPickFile() {
    fileRef.current?.click()
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append("file", file)
      const res = await fetch("/api/documents/upload", { method: "POST", body: uploadData })
      if (!res.ok) throw new Error("upload")
      const { pathname, taille } = (await res.json()) as { pathname: string; taille: number }
      await createDocument({
        titre: file.name,
        type: extToType(file.name),
        fichier: pathname,
        taille,
        dossierId,
        subStepStateId: sub.id,
      })
      toast.success("Document attaché.")
      router.refresh()
    } catch {
      toast.error("Ajout du document impossible.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={sub.coche}
          onCheckedChange={(v) => onToggle(Boolean(v))}
          disabled={!editable || pending}
          className="mt-0.5"
          aria-label={`Marquer "${sub.nom}" comme fait`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{sub.ordre}.</span>
            <span className={cn("text-sm", sub.coche && "text-muted-foreground line-through")}>
              {sub.nom}
            </span>
          </div>

          {sub.documentsRequis.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {sub.documentsRequis.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  <Paperclip className="size-3" /> {d}
                </span>
              ))}
            </div>
          )}

          {/* Attached documents */}
          {sub.documents.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {sub.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs">{doc.titre}</span>
                  </span>
                  {canDownload && (
                    <DownloadButton
                      url={`/api/documents/file?pathname=${encodeURIComponent(doc.fichier)}`}
                      filename={doc.titre}
                      variant="ghost"
                    >
                      <Download className="size-3.5" />
                      <span className="sr-only">Télécharger</span>
                    </DownloadButton>
                  )}
                </li>
              ))}
            </ul>
          )}

          {editable && (
            <div className="mt-2">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                onChange={onFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPickFile}
                disabled={uploading}
              >
                <Paperclip className="size-3.5" />
                {uploading ? "Envoi..." : "Attacher un document"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function DossierProcessInstance({
  dossierId,
  processName,
  etapeActuelle,
  steps,
  canEdit,
  isClosed,
  canDownload,
}: {
  dossierId: string
  processName: string
  etapeActuelle: number
  steps: StepItem[]
  canEdit: boolean
  isClosed: boolean
  canDownload: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onValidate(stepId: string) {
    startTransition(async () => {
      try {
        await validateStep(stepId)
        toast.success("Étape validée.")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Validation impossible.")
      }
    })
  }

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Aucun process n&apos;est associé à ce dossier.
        </CardContent>
      </Card>
    )
  }

  const totalSteps = steps.length
  const doneCount = steps.filter((s) => s.valide).length

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">{processName}</p>
            <p className="text-xs text-muted-foreground">
              {doneCount} / {totalSteps} étape{totalSteps > 1 ? "s" : ""} validée
              {doneCount > 1 ? "s" : ""}
            </p>
          </div>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(doneCount / totalSteps) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {steps.map((step) => {
        const isCurrent = step.ordre - 1 === etapeActuelle && !isClosed && !step.valide
        const isFuture = step.ordre - 1 > etapeActuelle && !step.valide
        const editable = canEdit && isCurrent
        const allChecked =
          step.subStepStates.length === 0 || step.subStepStates.every((s) => s.coche)

        return (
          <Card
            key={step.id}
            className={cn(
              "overflow-hidden transition-colors",
              isCurrent && "ring-2 ring-primary/40",
              isFuture && "opacity-70",
            )}
          >
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    step.valide
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {step.valide ? <Check className="size-4" /> : step.ordre}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{step.nom}</h3>
                    {step.valide ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="size-3" /> Validée
                      </span>
                    ) : isCurrent ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        <ChevronRight className="size-3" /> En cours
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {isClosed ? <Circle className="size-3" /> : <Lock className="size-3" />} À venir
                      </span>
                    )}
                    {step.dureeJours > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> {formatDuree(step.dureeJours)}
                      </span>
                    )}
                  </div>
                  {step.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  ) : null}
                  {step.commentaire ? (
                    <p className="mt-1 text-xs italic text-muted-foreground">{step.commentaire}</p>
                  ) : null}
                </div>
              </div>

              {/* Sub-steps */}
              {step.subStepStates.length > 0 ? (
                <div className="space-y-2 pl-11">
                  {step.subStepStates.map((sub) => (
                    <SubStepRow
                      key={sub.id}
                      sub={sub}
                      dossierId={dossierId}
                      editable={editable}
                      canDownload={canDownload}
                    />
                  ))}
                </div>
              ) : (
                <p className="pl-11 text-sm text-muted-foreground">Aucune sous-étape.</p>
              )}

              {editable && (
                <div className="flex items-center justify-between gap-3 border-t pt-3 pl-11">
                  <p className="text-xs text-muted-foreground">
                    {allChecked
                      ? "Toutes les sous-étapes sont cochées."
                      : "Cochez toutes les sous-étapes pour valider l'étape."}
                  </p>
                  <Button onClick={() => onValidate(step.id)} disabled={!allChecked || pending}>
                    <CheckCircle2 className="size-4" />
                    {pending ? "Validation..." : "Valider l'étape"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
