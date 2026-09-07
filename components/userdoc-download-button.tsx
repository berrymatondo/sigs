"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function UserDocDownloadButton() {
  const [loading, setLoading] = useState(false)

  async function download() {
    setLoading(true)
    try {
      const res = await fetch("/userdoc/pdf")
      if (!res.ok) throw new Error("Échec de génération")
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = href
      a.download = "SIGS-guide-utilisation.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
      toast.success("Téléchargement du guide démarré.")
    } catch {
      toast.error("Impossible de générer le PDF. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={download} disabled={loading} variant="outline" size="sm">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Télécharger en PDF
    </Button>
  )
}
