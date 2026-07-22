"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type Slide = {
  id: string
  route: string
  image: string | null
  caption: string
  narration: string
}

const SLIDES: Slide[] = [
  {
    id: "intro",
    route: "sigs.app",
    image: null,
    caption: "SIGS — vos démarches de voyage, simplifiées.",
    narration:
      "SIGS est la plateforme qui centralise toutes vos démarches de voyage et d'administration.",
  },
  {
    id: "home",
    route: "sigs.app",
    image: "/promo/home.png",
    caption: "Visa, voiture, assurance, hôtel : tout au même endroit.",
    narration:
      "Visa, location de voiture, assurance voyage, hôtel : soumettez vos dossiers et suivez-les en temps réel.",
  },
  {
    id: "services",
    route: "sigs.app/services",
    image: "/promo/services.png",
    caption: "Des services clairs, avec tarifs et documents requis.",
    narration:
      "Chaque service détaille les tarifs et les documents nécessaires, sans mauvaise surprise.",
  },
  {
    id: "contact",
    route: "sigs.app/contact",
    image: "/promo/contact.png",
    caption: "Une équipe joignable par téléphone, WhatsApp ou email.",
    narration:
      "Notre équipe reste joignable par téléphone, WhatsApp ou email pour vous accompagner.",
  },
  {
    id: "cta",
    route: "sigs.app",
    image: null,
    caption: "Créez votre compte et lancez votre premier dossier.",
    narration:
      "Créez votre compte dès aujourd'hui et confiez-nous votre premier dossier avec SIGS.",
  },
]

const FALLBACK_SLIDE_MS = 5500

type PlaybackState = "idle" | "playing" | "done"

export default function PromoPage() {
  const [state, setState] = useState<PlaybackState>("idle")
  const [slideIndex, setSlideIndex] = useState(0)
  const [muted, setMuted] = useState(false)
  const [supportsSpeech, setSupportsSpeech] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mutedRef = useRef(muted)
  const runIdRef = useRef(0)

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  useEffect(() => {
    setSupportsSpeech(
      typeof window !== "undefined" && "speechSynthesis" in window
    )
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const frenchVoice = useMemo(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window))
      return null
    const voices = window.speechSynthesis.getVoices()
    return voices.find((v) => v.lang?.toLowerCase().startsWith("fr")) ?? null
  }, [state])

  function playSlide(index: number, runId: number) {
    if (runId !== runIdRef.current) return

    if (index >= SLIDES.length) {
      setState("done")
      return
    }

    setSlideIndex(index)
    const slide = SLIDES[index]

    const goNext = () => {
      if (runId !== runIdRef.current) return
      playSlide(index + 1, runId)
    }

    if (supportsSpeech) {
      const utterance = new SpeechSynthesisUtterance(slide.narration)
      utterance.lang = "fr-FR"
      if (frenchVoice) utterance.voice = frenchVoice
      utterance.rate = 1
      utterance.volume = mutedRef.current ? 0 : 1
      utterance.onend = goNext
      utterance.onerror = goNext
      window.speechSynthesis.speak(utterance)
    } else {
      timeoutRef.current = setTimeout(goNext, FALLBACK_SLIDE_MS)
    }
  }

  function handlePlay() {
    runIdRef.current += 1
    const runId = runIdRef.current
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    setState("playing")
    playSlide(0, runId)
  }

  function handleReplay() {
    handlePlay()
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      return next
    })
  }

  const current = SLIDES[slideIndex]

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[oklch(0.16_0.03_264)] px-4 py-10 text-white">
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -right-20 bottom-10 size-80 rounded-full bg-accent/20 blur-3xl"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="mb-6 flex items-center gap-2 text-sm font-medium text-white/60">
        <ShieldCheck className="size-4 text-primary" />
        Vidéo de présentation SIGS · 30 secondes
      </div>

      {/* Browser mockup frame */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-yellow-400/80" />
          <span className="size-2.5 rounded-full bg-green-400/80" />
          <span className="ml-3 rounded-md bg-white/10 px-3 py-1 text-xs text-white/60">
            {current.route}
          </span>
        </div>

        <div className="relative aspect-video w-full overflow-hidden bg-[#0b1220]">
          {state === "idle" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-linear-to-br from-primary/20 to-transparent">
              <span className="text-2xl font-bold tracking-tight">SIGS</span>
              <p className="max-w-sm text-balance text-center text-sm text-white/70">
                Découvrez en 30 secondes comment SIGS simplifie vos démarches
                de voyage.
              </p>
              <Button
                size="lg"
                onClick={handlePlay}
                className="mt-2 gap-2 transition-transform hover:scale-[1.03]"
              >
                <Play className="size-4" />
                Lancer la vidéo
              </Button>
              {!supportsSpeech && (
                <p className="text-xs text-white/40">
                  Narration vocale non disponible sur ce navigateur : les
                  sous-titres s&apos;afficheront quand même.
                </p>
              )}
            </div>
          ) : (
            <>
              {SLIDES.map((slide, i) => (
                <div
                  key={slide.id}
                  className="absolute inset-0 transition-opacity duration-700 ease-out"
                  style={{
                    opacity: i === slideIndex ? 1 : 0,
                    pointerEvents: i === slideIndex ? "auto" : "none",
                  }}
                >
                  {slide.image ? (
                    <div className="absolute inset-0 overflow-hidden">
                      <Image
                        src={slide.image}
                        alt={slide.caption}
                        fill
                        className="object-cover object-top"
                        style={{
                          animation:
                            i === slideIndex
                              ? "sigs-promo-kenburns 6s ease-out forwards"
                              : undefined,
                        }}
                        priority
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/0 to-black/10" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary/25 via-[#0b1220] to-accent/10">
                      <span className="text-3xl font-bold tracking-tight">
                        SIGS
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Caption / subtitles */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center px-6 pb-6">
                <p
                  key={current.id}
                  className="animate-fade-up max-w-lg text-balance rounded-lg bg-black/50 px-4 py-2 text-center text-sm font-medium text-white backdrop-blur-sm sm:text-base"
                >
                  {current.caption}
                </p>
              </div>

              {/* Progress dots */}
              <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-1.5">
                {SLIDES.map((slide, i) => (
                  <span
                    key={slide.id}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === slideIndex
                        ? "w-8 bg-primary"
                        : i < slideIndex
                          ? "w-4 bg-white/50"
                          : "w-4 bg-white/15"
                    }`}
                  />
                ))}
              </div>

              {state === "done" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
                  <p className="text-lg font-semibold">
                    Prêt à simplifier vos démarches ?
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/sign-up">
                        Créer mon compte
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleReplay}
                      className="gap-2 border-white/30 text-white hover:bg-white/10"
                    >
                      <RotateCcw className="size-4" />
                      Revoir
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {state !== "idle" && (
          <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-4 py-2">
            <span className="text-xs text-white/50">
              {supportsSpeech ? "Narration en français" : "Sous-titres"}
            </span>
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={muted ? "Activer le son" : "Couper le son"}
            >
              {muted ? (
                <VolumeX className="size-3.5" />
              ) : (
                <Volume2 className="size-3.5" />
              )}
              {muted ? "Son coupé" : "Son activé"}
            </button>
          </div>
        )}
      </div>

      <Link
        href="/"
        className="mt-6 text-sm text-white/50 underline-offset-4 hover:text-white/80 hover:underline"
      >
        Retour au site
      </Link>

      <style>{`
        @keyframes sigs-promo-kenburns {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}
