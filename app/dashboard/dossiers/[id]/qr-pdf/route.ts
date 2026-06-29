import { NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { getDossier } from "../../actions"
import { dossierTypeLabels, formatClientName } from "@/lib/domain"
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
  const page = pdf.addPage([595.28, 841.89]) // A4 portrait
  const { width, height } = page.getSize()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const brand = rgb(0.13, 0.32, 0.74)
  const dark = rgb(0.12, 0.14, 0.2)
  const muted = rgb(0.42, 0.45, 0.52)
  const line = rgb(0.85, 0.87, 0.9)

  // Centered text helper
  const drawCentered = (
    text: string,
    yy: number,
    opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {},
  ) => {
    const size = opts.size ?? 10
    const f = opts.bold ? fontBold : font
    const textWidth = f.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: yy,
      size,
      font: f,
      color: opts.color ?? dark,
    })
  }

  // Header band
  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: brand })
  page.drawText("SIGS", {
    x: 48,
    y: height - 50,
    size: 22,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  page.drawText("Agence de services - Republique Democratique du Congo", {
    x: 48,
    y: height - 70,
    size: 9,
    font,
    color: rgb(0.85, 0.9, 1),
  })
  page.drawText("CODE QR DU DOSSIER", {
    x: width - 48 - fontBold.widthOfTextAtSize("CODE QR DU DOSSIER", 12),
    y: height - 50,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  // Dossier identity
  let y = height - 150
  drawCentered(dossier.nom, y, { size: 20, bold: true })
  y -= 24
  drawCentered(
    `${dossier.numero}  -  ${dossierTypeLabels[dossier.type] ?? dossier.type}`,
    y,
    { size: 11, color: muted },
  )
  y -= 18
  drawCentered(formatClientName(dossier.client), y, { size: 11, color: muted })

  // QR code (large, centered)
  const qrSize = 260
  const qrX = (width - qrSize) / 2
  const qrY = y - 40 - qrSize

  if (dossier.qrCode?.startsWith("data:image/png")) {
    try {
      const base64 = dossier.qrCode.split(",")[1]
      const bytes = Uint8Array.from(Buffer.from(base64, "base64"))
      const qrImage = await pdf.embedPng(bytes)

      // Framed card behind the QR
      const pad = 28
      page.drawRectangle({
        x: qrX - pad,
        y: qrY - pad,
        width: qrSize + pad * 2,
        height: qrSize + pad * 2,
        color: rgb(1, 1, 1),
        borderColor: line,
        borderWidth: 1,
      })
      page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })
    } catch {
      drawCentered("Code QR indisponible", qrY + qrSize / 2, { size: 12, color: muted })
    }
  } else {
    drawCentered("Code QR indisponible", qrY + qrSize / 2, { size: 12, color: muted })
  }

  // Instruction
  drawCentered("Scannez ce code pour suivre l'avancement du dossier", qrY - 60, {
    size: 11,
    bold: true,
    color: brand,
  })

  // Footer
  page.drawText(
    `Document genere le ${format(new Date(), "d MMMM yyyy 'a' HH:mm", { locale: fr })}`,
    { x: 48, y: 40, size: 8, font, color: muted },
  )

  const bytes = await pdf.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dossier.numero}-qr.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
