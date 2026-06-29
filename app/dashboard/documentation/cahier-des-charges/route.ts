import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { PdfBuilder, pdfSafe } from "@/lib/pdf-builder"
import { requireUser, isStaff } from "@/lib/session"
import { APP_NAME, APP_OVERVIEW, cahierDesCharges, docSections, type CahierGroup } from "@/lib/documentation"

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

  const cdc = cahierDesCharges
  const pdf = await PdfBuilder.create("Cahier des charges")
  pdf.coverTitle(
    "Cahier des charges",
    pdfSafe(`${APP_NAME} — spécifications fonctionnelles et techniques`),
  )

  pdf.heading("1. Contexte du projet")
  pdf.paragraph(pdfSafe(cdc.contexte))
  pdf.spacer(4)
  pdf.paragraph(
    pdfSafe(
      "Ce document constitue la référence contractuelle du projet. Il décrit le besoin, le périmètre, " +
        "les exigences fonctionnelles et techniques ainsi que les livrables attendus. Une annexe illustrée " +
        "présente les principaux écrans de la solution telle qu'implémentée.",
    ),
    { color: undefined },
  )
  pdf.spacer(8)

  pdf.heading("2. Objectifs")
  pdf.paragraph(
    pdfSafe("Les objectifs ci-dessous traduisent les bénéfices métier attendus de la solution :"),
    { color: undefined },
  )
  pdf.spacer(4)
  for (const o of cdc.objectifs) pdf.bullet(pdfSafe(o))
  pdf.spacer(8)

  const renderGroups = (groups: CahierGroup[]) => {
    for (const g of groups) {
      pdf.subheading(pdfSafe(g.titre))
      for (const p of g.points) pdf.bullet(pdfSafe(p))
      pdf.spacer(6)
    }
  }

  pdf.heading("3. Périmètre")
  pdf.paragraph(
    pdfSafe(
      "Le périmètre délimite ce qui est couvert par la première version de la solution et ce qui en est " +
        "explicitement exclu, afin de cadrer les attentes et les évolutions futures.",
    ),
    { color: undefined },
  )
  pdf.spacer(6)
  renderGroups(cdc.perimetre)

  pdf.heading("4. Exigences fonctionnelles")
  pdf.paragraph(
    pdfSafe(
      "Les exigences fonctionnelles décrivent les capacités attendues du système du point de vue des " +
        "utilisateurs (agents, managers, administrateurs et visiteurs), regroupées par domaine fonctionnel.",
    ),
    { color: undefined },
  )
  pdf.spacer(6)
  renderGroups(cdc.exigencesFonctionnelles)

  pdf.heading("5. Description technique")
  pdf.paragraph(
    pdfSafe(
      "Cette section décrit l'architecture logicielle, les choix technologiques et les contraintes de mise en œuvre de la solution. " +
        `La solution s'appuie sur la pile suivante : ${APP_OVERVIEW.stack.join(", ")}.`,
    ),
    { color: undefined },
  )
  pdf.spacer(6)
  renderGroups(cdc.exigencesTechniques)

  pdf.heading("6. Exigences non fonctionnelles")
  pdf.paragraph(
    pdfSafe(
      "Les exigences non fonctionnelles fixent les niveaux de qualité attendus (performance, accessibilité, " +
        "sécurité d'usage et maintenabilité) indépendamment des fonctionnalités.",
    ),
    { color: undefined },
  )
  pdf.spacer(6)
  renderGroups(cdc.exigencesNonFonctionnelles)

  pdf.heading("7. Rôles et permissions")
  pdf.paragraph(
    pdfSafe("Le contrôle d'accès repose sur quatre rôles aux périmètres croissants :"),
    { color: undefined },
  )
  pdf.spacer(4)
  for (const r of APP_OVERVIEW.roles) pdf.bullet(pdfSafe(`${r.role} : ${r.desc}`))
  pdf.spacer(8)

  pdf.heading("8. Livrables")
  for (const l of cdc.livrables) pdf.bullet(pdfSafe(l))
  pdf.spacer(8)

  // Illustrated appendix: a guided tour of the main screens with captions.
  pdf.heading("9. Panorama des écrans")
  pdf.paragraph(
    pdfSafe(
      "Cette annexe illustre la solution livrée : pour chaque écran clé, une capture d'écran accompagnée " +
        "d'un court descriptif fonctionnel et de la route correspondante.",
    ),
    { color: undefined },
  )
  pdf.spacer(8)

  for (const section of docSections) {
    pdf.subheading(pdfSafe(section.title))
    for (const page of section.pages) {
      const shot = await loadScreenshot(page.screenshot)
      if (!shot) continue
      pdf.label(pdfSafe(`${page.title}  —  ${page.route}`))
      pdf.paragraph(pdfSafe(page.business), { size: 9, color: undefined })
      pdf.spacer(2)
      await pdf.image(shot, {
        caption: pdfSafe(page.screenshotAlt || `Aperçu de la page ${page.title}`),
      })
      pdf.spacer(6)
    }
  }

  const bytes = await pdf.toBytes()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="SIGS-cahier-des-charges.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
