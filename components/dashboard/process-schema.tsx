"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { CheckCircle2, Workflow } from "lucide-react"
import { formatDuree } from "@/lib/domain"

export type ProcessSchemaData = {
  nom: string
  description: string | null
  actif: boolean
  dossiersTotal: number
  dossiersTermines: number
  steps: {
    id: string
    ordre: number
    nom: string
    dureeJours: number
    description: string | null
    dossiersEnCours: number
    subSteps: { id: string; nom: string }[]
  }[]
}

type Point = { x: number; y: number }
type Arrow = { path: string; color: "blue" | "emerald" }
// Plain numeric snapshot of a box's position relative to the diagram
// container. DOMRect's top/right/bottom/left are prototype accessors, not
// own enumerable properties, so `{...someDOMRect}` silently drops them —
// this shape avoids that trap.
type RelativeRect = { top: number; bottom: number; left: number; right: number; width: number; height: number }

function toRelativeRect(r: DOMRect, containerRect: DOMRect): RelativeRect {
  return {
    top: r.top - containerRect.top,
    bottom: r.bottom - containerRect.top,
    left: r.left - containerRect.left,
    right: r.right - containerRect.left,
    width: r.width,
    height: r.height,
  }
}

// Builds an SVG path connecting the right edge of box A to the left edge of
// box B when they sit on the same row, or the bottom of A to the top of B
// (a vertical S-curve) when B wrapped onto the next row.
function connectorPath(a: RelativeRect, b: RelativeRect): string {
  const sameRow = Math.abs(a.top - b.top) < 12
  if (sameRow) {
    const start: Point = { x: a.right, y: a.top + a.height / 2 }
    const end: Point = { x: b.left, y: b.top + b.height / 2 }
    const midX = (start.x + end.x) / 2
    return `M ${start.x} ${start.y} C ${midX} ${start.y} ${midX} ${end.y} ${end.x} ${end.y}`
  }
  const start: Point = { x: a.left + a.width / 2, y: a.bottom }
  const end: Point = { x: b.left + b.width / 2, y: b.top }
  const midY = (start.y + end.y) / 2
  return `M ${start.x} ${start.y} C ${start.x} ${midY} ${end.x} ${midY} ${end.x} ${end.y}`
}

function CountBadge({ count, tone }: { count: number; tone: "blue" | "emerald" }) {
  const active = count > 0
  const colors =
    tone === "blue"
      ? active
        ? "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.7)]"
        : "border-2 border-slate-600 bg-slate-950 text-slate-500"
      : active
        ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
        : "border-2 border-slate-600 bg-slate-950 text-slate-500"
  return (
    <span
      className={`absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full text-xs font-bold text-white ${colors}`}
    >
      {count}
    </span>
  )
}

export function ProcessSchema({ process }: { process: ProcessSchemaData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const boxRefs = useRef<(HTMLDivElement | null)[]>([])
  const [arrows, setArrows] = useState<Arrow[]>([])
  const nodeCount = process.steps.length + 1 // + the terminal "Terminé" box

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const rects = boxRefs.current
        .slice(0, nodeCount)
        .map((el) => (el ? el.getBoundingClientRect() : null))

      const next: Arrow[] = []
      for (let i = 0; i < rects.length - 1; i++) {
        const a = rects[i]
        const b = rects[i + 1]
        if (!a || !b) continue
        next.push({
          path: connectorPath(toRelativeRect(a, containerRect), toRelativeRect(b, containerRect)),
          color: i === rects.length - 2 ? "emerald" : "blue",
        })
      }
      setArrows(next)
    }

    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [nodeCount])

  return (
    <div className="rounded-2xl bg-slate-950 p-6 text-slate-200 sm:p-10">
      {/* Legend */}
      <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="size-4 rounded border-2 border-blue-500 bg-blue-950" />
          Étape avec dossier en cours
        </span>
        <span className="flex items-center gap-2">
          <span className="size-4 rounded border-2 border-slate-600 bg-slate-900" />
          Étape sans dossier en cours
        </span>
        <span className="flex items-center gap-2">
          <span className="size-4 rounded border-2 border-emerald-500 bg-emerald-950" />
          Succès / Complet
        </span>
        <span className="ml-auto text-slate-400">
          {process.dossiersTotal} dossier{process.dossiersTotal > 1 ? "s" : ""} · {process.dossiersTermines}{" "}
          terminé{process.dossiersTermines > 1 ? "s" : ""}
        </span>
      </div>

      {process.steps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-500">
          <Workflow className="size-8" />
          <p className="text-sm">Ce process ne comporte encore aucune étape.</p>
        </div>
      ) : (
        <div ref={containerRef} className="relative">
          <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
            <defs>
              <marker
                id="arrow-blue"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#3b82f6" />
              </marker>
              <marker
                id="arrow-emerald"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#10b981" />
              </marker>
            </defs>
            {arrows.map((arrow, i) => (
              <path
                key={i}
                d={arrow.path}
                fill="none"
                stroke={arrow.color === "blue" ? "#3b82f6" : "#10b981"}
                strokeWidth={2}
                markerEnd={`url(#arrow-${arrow.color})`}
              />
            ))}
          </svg>

          <div className="grid gap-x-16 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {process.steps.map((step, i) => (
              <div
                key={step.id}
                ref={(el) => {
                  boxRefs.current[i] = el
                }}
                className={`relative rounded-xl border-2 bg-slate-900 p-5 ${
                  step.dossiersEnCours > 0
                    ? "border-blue-500 shadow-[0_0_24px_-8px_rgba(59,130,246,0.5)]"
                    : "border-slate-700"
                }`}
              >
                <CountBadge count={step.dossiersEnCours} tone="blue" />
                <span className="text-xs font-medium uppercase tracking-wide text-blue-400">
                  Étape {step.ordre} · {formatDuree(step.dureeJours)}
                </span>
                <h3 className="mt-1 text-lg font-bold text-white text-balance">{step.nom}</h3>
                {step.description ? (
                  <p className="mt-1 text-sm text-slate-400 text-pretty">{step.description}</p>
                ) : null}
                {step.subSteps.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1.5 border-t border-slate-800 pt-3">
                    {step.subSteps.map((sub) => (
                      <li key={sub.id} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="size-1.5 shrink-0 rounded-full bg-slate-500" />
                        {sub.nom}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            <div
              ref={(el) => {
                boxRefs.current[process.steps.length] = el
              }}
              className="relative rounded-xl border-2 border-emerald-500 bg-emerald-950/40 p-5 shadow-[0_0_24px_-8px_rgba(16,185,129,0.6)]"
            >
              <CountBadge count={process.dossiersTermines} tone="emerald" />
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                Succès / Complet
              </span>
              <h3 className="mt-1 flex items-center gap-2 text-lg font-bold text-white">
                <CheckCircle2 className="size-5 text-emerald-400" />
                Terminé
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
