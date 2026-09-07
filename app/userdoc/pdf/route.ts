import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { PdfBuilder, pdfSafe } from "@/lib/pdf-builder"
import { requireUser } from "@/lib/session"
import { USERDOC_TITLE, USERDOC_INTRO, userDocSections } from "@/lib/userdoc"

// Read a screenshot stored under /public (e.g. "/userdoc/dashboard.png") as raw bytes.
async function loadScreenshot(screenshot?: string) {
  if (!screenshot) return null
  try {
    const filePath = join(process.cwd(), "public", screenshot.replace(/^\//, ""))
    return await readFile(filePath)
  } catch {
    return null
  }
}

export async function GET() {
  // Any authenticated user (this guide targets clients, but staff may read it too).
  await requireUser()

  const pdf = await PdfBuilder.create("Guide d'utilisation")
  pdf.coverTitle(pdfSafe(USERDOC_TITLE), pdfSafe(USERDOC_INTRO))

  for (const [i, section] of userDocSections.entries()) {
    pdf.heading(pdfSafe(`${i + 1}. ${section.title}`))
    pdf.paragraph(pdfSafe(section.intro))
    pdf.spacer(4)

    if (section.tips.length > 0) {
      section.tips.forEach((tip, j) => pdf.numbered(j + 1, pdfSafe(tip)))
      pdf.spacer(4)
    }

    const shot = await loadScreenshot(section.screenshot)
    if (shot) {
      await pdf.image(shot, {
        caption: pdfSafe(section.screenshotAlt || `Aperçu — ${section.title}`),
      })
    }

    pdf.spacer(10)
  }

  const bytes = await pdf.toBytes()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="SIGS-guide-utilisation.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
