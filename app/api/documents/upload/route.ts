import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    // Any authenticated user can upload; the document record creation enforces
    // that visitors may only attach files to a dossier they own.
    await requireUser()

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 })
    }

    // Store under a documents/ prefix with a timestamp to avoid collisions.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const blob = await put(`documents/${Date.now()}-${safeName}`, file, {
      access: "private",
    })

    return NextResponse.json({
      pathname: blob.pathname,
      taille: file.size,
      name: file.name,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Échec de l'upload." }, { status: 500 })
  }
}
