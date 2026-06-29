"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

/**
 * Downloads a file from a same-origin URL via fetch + object URL.
 *
 * A plain <a target="_blank"> link does not reliably trigger a download inside
 * the sandboxed preview iframe (new tabs/popups are blocked), so we fetch the
 * bytes and create a temporary object URL to force the download instead.
 */
export function DownloadButton({
  url,
  filename,
  children,
  variant = "outline",
}: {
  url: string
  filename: string
  children: React.ReactNode
  variant?: "outline" | "default" | "secondary" | "ghost"
}) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error("Téléchargement impossible. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={variant} onClick={handleDownload} disabled={loading}>
      {children}
    </Button>
  )
}
