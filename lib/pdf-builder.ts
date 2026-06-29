import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

// Lightweight A4 document builder on top of pdf-lib with automatic pagination,
// text wrapping and a few semantic helpers (title, heading, paragraph, bullet).
// Shared by the documentation and cahier des charges PDF routes.

const A4: [number, number] = [595.28, 841.89]
const MARGIN = 48

export const PDF_COLORS = {
  brand: rgb(0.13, 0.32, 0.74),
  dark: rgb(0.12, 0.14, 0.2),
  muted: rgb(0.42, 0.45, 0.52),
  line: rgb(0.85, 0.87, 0.9),
  soft: rgb(0.96, 0.97, 0.99),
  white: rgb(1, 1, 1),
}

export class PdfBuilder {
  private doc!: PDFDocument
  private page!: PDFPage
  private font!: PDFFont
  private fontBold!: PDFFont
  private y = 0
  private width = A4[0]
  private height = A4[1]
  private headerTitle = ""
  private pageNumber = 0

  static async create(headerTitle: string) {
    const b = new PdfBuilder()
    b.doc = await PDFDocument.create()
    b.font = await b.doc.embedFont(StandardFonts.Helvetica)
    b.fontBold = await b.doc.embedFont(StandardFonts.HelveticaBold)
    b.headerTitle = headerTitle
    b.addPage()
    return b
  }

  private addPage() {
    this.page = this.doc.addPage(A4)
    this.pageNumber += 1
    this.y = this.height - MARGIN
    this.drawRunningHeader()
    this.drawFooter()
  }

  private drawRunningHeader() {
    // Slim top band on every page.
    this.page.drawRectangle({ x: 0, y: this.height - 28, width: this.width, height: 28, color: PDF_COLORS.brand })
    this.page.drawText("SIGS", { x: MARGIN, y: this.height - 19, size: 10, font: this.fontBold, color: PDF_COLORS.white })
    const label = this.headerTitle
    const labelWidth = this.font.widthOfTextAtSize(label, 8)
    this.page.drawText(label, {
      x: this.width - MARGIN - labelWidth,
      y: this.height - 18,
      size: 8,
      font: this.font,
      color: rgb(0.85, 0.9, 1),
    })
    this.y = this.height - 28 - 28
  }

  private drawFooter() {
    const text = `Page ${this.pageNumber}`
    const w = this.font.widthOfTextAtSize(text, 8)
    this.page.drawText(text, {
      x: this.width - MARGIN - w,
      y: MARGIN - 22,
      size: 8,
      font: this.font,
      color: PDF_COLORS.muted,
    })
    this.page.drawText("SIGS — Système Intégré de Gestion de Services", {
      x: MARGIN,
      y: MARGIN - 22,
      size: 8,
      font: this.font,
      color: PDF_COLORS.muted,
    })
  }

  private ensure(needed: number) {
    if (this.y - needed < MARGIN + 8) {
      this.addPage()
    }
  }

  private wrap(text: string, size: number, font: PDFFont, maxWidth: number) {
    const words = text.split(/\s+/)
    const lines: string[] = []
    let line = ""
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line)
        line = w
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    return lines
  }

  get contentWidth() {
    return this.width - MARGIN * 2
  }

  // Cover title block on the first page.
  coverTitle(title: string, subtitle: string) {
    this.page.drawRectangle({ x: 0, y: this.height - 150, width: this.width, height: 122, color: PDF_COLORS.brand })
    this.page.drawText(title, { x: MARGIN, y: this.height - 86, size: 22, font: this.fontBold, color: PDF_COLORS.white })
    const subLines = this.wrap(subtitle, 11, this.font, this.contentWidth)
    let sy = this.height - 108
    for (const l of subLines) {
      this.page.drawText(l, { x: MARGIN, y: sy, size: 11, font: this.font, color: rgb(0.88, 0.92, 1) })
      sy -= 15
    }
    this.y = this.height - 172
    this.paragraph(
      `Document généré le ${format(new Date(), "d MMMM yyyy 'à' HH:mm", { locale: fr })}`,
      { size: 9, color: PDF_COLORS.muted },
    )
    this.y -= 6
  }

  heading(text: string, opts: { size?: number } = {}) {
    const size = opts.size ?? 14
    this.ensure(size + 22)
    this.y -= 6
    this.page.drawText(text, { x: MARGIN, y: this.y, size, font: this.fontBold, color: PDF_COLORS.brand })
    this.y -= 8
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: this.width - MARGIN, y: this.y },
      thickness: 1,
      color: PDF_COLORS.line,
    })
    this.y -= 16
  }

  subheading(text: string) {
    this.ensure(28)
    this.y -= 2
    const lines = this.wrap(text, 11, this.fontBold, this.contentWidth)
    for (const l of lines) {
      this.ensure(16)
      this.page.drawText(l, { x: MARGIN, y: this.y, size: 11, font: this.fontBold, color: PDF_COLORS.dark })
      this.y -= 16
    }
  }

  // Small uppercase tag rendered on its own line (section micro-label).
  label(text: string) {
    this.ensure(16)
    this.page.drawText(text.toUpperCase(), { x: MARGIN, y: this.y, size: 8, font: this.fontBold, color: PDF_COLORS.brand })
    this.y -= 13
  }

  // Small uppercase tag + value on the same logical block.
  labeled(label: string, value: string) {
    this.label(label)
    this.paragraph(value, { size: 10 })
  }

  // Ordered list item with a brand-coloured number prefix.
  numbered(index: number, text: string) {
    const size = 10
    const lines = this.wrap(text, size, this.font, this.contentWidth - 22)
    lines.forEach((l, i) => {
      this.ensure(size + 5)
      if (i === 0) {
        this.page.drawText(`${index}.`, { x: MARGIN + 2, y: this.y, size, font: this.fontBold, color: PDF_COLORS.brand })
      }
      this.page.drawText(l, { x: MARGIN + 22, y: this.y, size, font: this.font, color: PDF_COLORS.dark })
      this.y -= size + 5
    })
  }

  // Embed a PNG screenshot, scaled to fit the content width (capped height),
  // centered, with a thin frame and an optional caption. Paginates if needed.
  async image(bytes: Uint8Array | Buffer, opts: { caption?: string; maxHeight?: number } = {}) {
    let png
    try {
      png = await this.doc.embedPng(bytes)
    } catch {
      return
    }
    const maxW = this.contentWidth
    const maxH = opts.maxHeight ?? 340
    const ratio = Math.min(maxW / png.width, maxH / png.height, 1)
    const w = png.width * ratio
    const h = png.height * ratio
    const capH = opts.caption ? 14 : 0

    this.ensure(h + capH + 12)
    const x = MARGIN + (this.contentWidth - w) / 2
    this.y -= h
    this.page.drawRectangle({
      x: x - 1,
      y: this.y - 1,
      width: w + 2,
      height: h + 2,
      borderColor: PDF_COLORS.line,
      borderWidth: 1,
    })
    this.page.drawImage(png, { x, y: this.y, width: w, height: h })
    this.y -= 6
    if (opts.caption) {
      this.paragraph(opts.caption, { size: 8, color: PDF_COLORS.muted })
    }
    this.y -= 6
  }

  paragraph(text: string, opts: { size?: number; color?: ReturnType<typeof rgb>; indent?: number } = {}) {
    const size = opts.size ?? 10
    const indent = opts.indent ?? 0
    const lines = this.wrap(text, size, this.font, this.contentWidth - indent)
    for (const l of lines) {
      this.ensure(size + 5)
      this.page.drawText(l, {
        x: MARGIN + indent,
        y: this.y,
        size,
        font: this.font,
        color: opts.color ?? PDF_COLORS.dark,
      })
      this.y -= size + 5
    }
  }

  bullet(text: string) {
    const size = 10
    const lines = this.wrap(text, size, this.font, this.contentWidth - 16)
    lines.forEach((l, i) => {
      this.ensure(size + 5)
      if (i === 0) {
        this.page.drawText("•", { x: MARGIN + 2, y: this.y, size, font: this.fontBold, color: PDF_COLORS.brand })
      }
      this.page.drawText(l, { x: MARGIN + 16, y: this.y, size, font: this.font, color: PDF_COLORS.dark })
      this.y -= size + 5
    })
  }

  tag(text: string) {
    // inline pill rendered as bracketed label to keep it simple/portable
    this.ensure(14)
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 9, font: this.font, color: PDF_COLORS.muted })
    this.y -= 14
  }

  spacer(px = 8) {
    this.y -= px
  }

  async toBytes() {
    return this.doc.save()
  }
}

// Strip characters that the standard Helvetica (WinAnsi) cannot encode.
export function pdfSafe(text: string) {
  return (
    text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[\u2192\u2794\u27A1]/g, "->") // arrows → ➔ ➡
      .replace(/[\u2190]/g, "<-")
      .replace(/\u2026/g, "...")
      .replace(/[\u2022\u00B7]/g, "-") // bullet / middle dot
      .replace(/\u00A0/g, " ")
      // Drop anything still outside the Latin-1 range that WinAnsi can't encode.
      .replace(/[^\u0000-\u00FF]/g, "")
  )
}
