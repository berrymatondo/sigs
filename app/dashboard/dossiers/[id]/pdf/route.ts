import { NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { getDossier } from "../../actions"
import {
  dossierTypeLabels,
  dossierStatutLabels,
  tacheStatutLabels,
  prioriteLabels,
  formatUsd,
  formatClientName,
} from "@/lib/domain"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // getDossier enforces auth + per-role access (visitors only see their own dossier)
  const dossier = await getDossier(id)
  if (!dossier) {
    return new NextResponse("Dossier introuvable", { status: 404 })
  }

  const pdf = await PDFDocument.create()
  let page = pdf.addPage([595.28, 841.89]) // A4 portrait
  const { width, height } = page.getSize()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const margin = 48
  const brand = rgb(0.13, 0.32, 0.74)
  const dark = rgb(0.12, 0.14, 0.2)
  const muted = rgb(0.42, 0.45, 0.52)
  const line = rgb(0.85, 0.87, 0.9)
  let y = height - margin

  const draw = (
    text: string,
    x: number,
    yy: number,
    opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {},
  ) => {
    page.drawText(text, {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.bold ? fontBold : font,
      color: opts.color ?? dark,
    })
  }

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdf.addPage([595.28, 841.89])
      y = height - margin
    }
  }

  // Header band
  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: brand })
  draw("SIGS", margin, height - 50, { size: 22, bold: true, color: rgb(1, 1, 1) })
  draw("Agence de services - Republique Democratique du Congo", margin, height - 70, {
    size: 9,
    color: rgb(0.85, 0.9, 1),
  })
  draw("FICHE DOSSIER", width - margin - 110, height - 50, {
    size: 12,
    bold: true,
    color: rgb(1, 1, 1),
  })

  y = height - 130

  // Title
  draw(dossier.nom, margin, y, { size: 18, bold: true })
  y -= 18
  draw(`${dossier.numero}  -  ${dossierTypeLabels[dossier.type] ?? dossier.type}`, margin, y, {
    size: 10,
    color: muted,
  })
  y -= 26

  // QR code (embedded from the stored data URL)
  if (dossier.qrCode?.startsWith("data:image/png")) {
    try {
      const base64 = dossier.qrCode.split(",")[1]
      const bytes = Uint8Array.from(Buffer.from(base64, "base64"))
      const qrImage = await pdf.embedPng(bytes)
      const qrSize = 96
      page.drawImage(qrImage, {
        x: width - margin - qrSize,
        y: y - qrSize + 12,
        width: qrSize,
        height: qrSize,
      })
      draw("Scannez pour le suivi", width - margin - qrSize - 6, y - qrSize + 2, {
        size: 7,
        color: muted,
      })
    } catch {
      // ignore malformed QR
    }
  }

  // Section: informations
  const section = (label: string) => {
    ensureSpace(40)
    draw(label.toUpperCase(), margin, y, { size: 9, bold: true, color: brand })
    y -= 8
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: line,
    })
    y -= 18
  }

  const row = (label: string, value: string) => {
    ensureSpace(18)
    draw(label, margin, y, { size: 9, color: muted })
    draw(value || "-", margin + 150, y, { size: 10 })
    y -= 18
  }

  section("Informations du dossier")
  row("Client", formatClientName(dossier.client))
  row("Type de service", dossierTypeLabels[dossier.type] ?? dossier.type)
  row("Statut", dossierStatutLabels[dossier.statut] ?? dossier.statut)
  row("Montant", formatUsd(dossier.montant))
  row("Agent responsable", dossier.agent?.name ?? "-")
  row("Cree le", format(dossier.createdAt, "d MMMM yyyy", { locale: fr }))

  if (dossier.notes) {
    y -= 8
    section("Notes")
    const words = dossier.notes.split(/\s+/)
    let lineStr = ""
    const maxWidth = width - margin * 2
    for (const w of words) {
      const test = lineStr ? `${lineStr} ${w}` : w
      if (font.widthOfTextAtSize(test, 10) > maxWidth) {
        ensureSpace(16)
        draw(lineStr, margin, y, { size: 10 })
        y -= 16
        lineStr = w
      } else {
        lineStr = test
      }
    }
    if (lineStr) {
      ensureSpace(16)
      draw(lineStr, margin, y, { size: 10 })
      y -= 16
    }
  }

  // Section: documents
  y -= 8
  section(`Documents (${dossier.documents.length})`)
  if (dossier.documents.length === 0) {
    row("", "Aucun document")
  } else {
    for (const doc of dossier.documents) {
      ensureSpace(18)
      draw(`- ${doc.titre}`, margin, y, { size: 10 })
      draw(doc.type, width - margin - 80, y, { size: 9, color: muted })
      y -= 18
    }
  }

  // Section: taches
  y -= 8
  section(`Taches (${dossier.taches.length})`)
  if (dossier.taches.length === 0) {
    row("", "Aucune tache")
  } else {
    for (const t of dossier.taches) {
      ensureSpace(18)
      draw(`- ${t.titre}`, margin, y, { size: 10 })
      draw(
        `${prioriteLabels[t.priorite] ?? t.priorite} / ${tacheStatutLabels[t.statut] ?? t.statut}`,
        width - margin - 150,
        y,
        { size: 9, color: muted },
      )
      y -= 18
    }
  }

  // Footer
  draw(
    `Document genere le ${format(new Date(), "d MMMM yyyy 'a' HH:mm", { locale: fr })}`,
    margin,
    margin - 16,
    { size: 8, color: muted },
  )

  const bytes = await pdf.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dossier.numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
