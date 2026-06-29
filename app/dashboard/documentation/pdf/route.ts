import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { PdfBuilder, pdfSafe } from "@/lib/pdf-builder"
import { requireUser, isStaff } from "@/lib/session"
import { APP_NAME, APP_OVERVIEW, docSections } from "@/lib/documentation"

// Read a screenshot stored under /public (e.g. "/docs/home.png") as raw bytes.
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
  const user = await requireUser()
  if (!isStaff(user.role)) {
    return new NextResponse("Accès non autorisé", { status: 403 })
  }

  const pdf = await PdfBuilder.create("Documentation")
  pdf.coverTitle(pdfSafe(APP_NAME), pdfSafe(APP_OVERVIEW.pitch))

  // Overview
  pdf.heading("Vue d'ensemble")
  pdf.subheading("Pile technologique")
  for (const s of APP_OVERVIEW.stack) pdf.bullet(pdfSafe(s))
  pdf.spacer(6)
  pdf.subheading("Rôles et permissions")
  for (const r of APP_OVERVIEW.roles) pdf.bullet(pdfSafe(`${r.role} : ${r.desc}`))
  pdf.spacer(10)

  // Sections & pages
  for (const section of docSections) {
    pdf.heading(pdfSafe(section.title))
    pdf.paragraph(pdfSafe(section.description), { color: undefined })
    pdf.spacer(6)

    for (const page of section.pages) {
      pdf.subheading(pdfSafe(page.title))
      pdf.tag(pdfSafe(`Route : ${page.route}  |  Accès : ${page.audience.join(", ")}`))

      const shot = await loadScreenshot(page.screenshot)
      if (shot) {
        await pdf.image(shot, {
          caption: pdfSafe(page.screenshotAlt || `Aperçu de la page ${page.title} (${page.route})`),
        })
      }

      pdf.labeled("Métier", pdfSafe(page.business))
      pdf.labeled("Technique", pdfSafe(page.technical))

      if (page.walkthrough && page.walkthrough.length > 0) {
        pdf.label("Comment ça marche")
        page.walkthrough.forEach((step, i) => pdf.numbered(i + 1, pdfSafe(step)))
      }

      pdf.labeled("Fonctionnalités", pdfSafe(page.features.join(" · ")))
      pdf.spacer(10)
    }
  }

  const bytes = await pdf.toBytes()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="SIGS-documentation.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
