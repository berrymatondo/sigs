"use client"

import { useState } from "react"
import { FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type DownloadKey = "doc" | "cdc"

const ENDPOINTS: Record<DownloadKey, { url: string; filename: string; label: string }> = {
  doc: {
    url: "/dashboard/documentation/pdf",
    filename: "SIGS-documentation.pdf",
    label: "la documentation",
  },
  cdc: {
    url: "/dashboard/documentation/cahier-des-charges",
    filename: "SIGS-cahier-des-charges.pdf",
    label: "le cahier des charges",
  },
}

export function DocumentationDownloads() {
  const [loading, setLoading] = useState<DownloadKey | null>(null)

  async function download(key: DownloadKey) {
    const { url, filename, label } = ENDPOINTS[key]
    setLoading(key)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Échec de génération")
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = href
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
      toast.success(`Téléchargement de ${label} démarré.`)
    } catch {
      toast.error(`Impossible de générer ${label}. Réessayez.`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button onClick={() => download("doc")} disabled={loading !== null} className="gap-2">
        {loading === "doc" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <FileText className="size-4" aria-hidden />
        )}
        Télécharger la documentation
      </Button>
      <Button
        onClick={() => download("cdc")}
        disabled={loading !== null}
        variant="outline"
        className="gap-2"
      >
        {loading === "cdc" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <FileSpreadsheet className="size-4" aria-hidden />
        )}
        Cahier des charges (PDF)
      </Button>
    </div>
  )
}
