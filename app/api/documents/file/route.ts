import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { requireUser, isStaff } from "@/lib/session"

export async function GET(request: NextRequest) {
  const user = await requireUser()

  try {
    const pathname = request.nextUrl.searchParams.get("pathname")
    if (!pathname) {
      return NextResponse.json({ error: "Pathname manquant." }, { status: 400 })
    }

    // Ensure the document exists and the user is allowed to access it.
    const doc = await prisma.document.findFirst({
      where: { fichier: pathname },
      include: {
        dossier: { include: { client: true } },
        client: true,
      },
    })

    if (!doc) {
      return new NextResponse("Introuvable", { status: 404 })
    }

    if (!isStaff(user.role)) {
      const ownerId = doc.userId ?? doc.dossier?.client?.userId ?? doc.client?.userId
      if (ownerId !== user.id) {
        return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
      }
    }

    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })

    if (!result) {
      return new NextResponse("Introuvable", { status: 404 })
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-cache",
        },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (error) {
    console.error("[v0] Serve file error:", error)
    return NextResponse.json({ error: "Échec de la lecture du fichier." }, { status: 500 })
  }
}
