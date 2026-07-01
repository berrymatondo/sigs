"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  FolderKanban,
  QrCode,
  Workflow,
  ShieldCheck,
  BarChart3,
  Clock,
  FileText,
  CheckCircle2,
  Play,
  RotateCcw,
  ArrowRight,
  Volume2,
  VolumeX,
} from "lucide-react"

// Total runtime: 30 seconds. Each scene has a start time (ms) and duration.
const SCENES = [
  { id: "intro", start: 0, end: 4000 },
  { id: "probleme", start: 4000, end: 8800 },
  { id: "solution", start: 8800, end: 13800 },
  { id: "apercu", start: 13800, end: 19800 },
  { id: "process", start: 19800, end: 23800 },
  { id: "chiffres", start: 23800, end: 27000 },
  { id: "cta", start: 27000, end: 30000 },
] as const

const TOTAL = 30000

// French voice-over line for each scene.
const VOICE: Record<string, string> = {
  intro: "À Kinshasa, gérez vos dossiers, sans le papier.",
  probleme: "Files d'attente, dossiers égarés, aucune visibilité. Ça suffit.",
  solution: "SIGS centralise vos dossiers, automatise vos processus, et sécurise vos données.",
  apercu: "Tableau de bord, dossiers, processus et analyses : tout est réuni dans une seule plateforme.",
  process: "Chaque étape est suivie, et vos clients scannent un QR code pour tout voir.",
  chiffres: "Trois fois plus rapide. Cent pour cent de vos dossiers tracés.",
  cta: "SIGS. Demandez votre démo gratuite, dès aujourd'hui.",
}

export function PromoReel() {
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [muted, setMuted] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startTsRef = useRef<number>(0)
  const mutedRef = useRef(false)
  const spokenRef = useRef<string | null>(null)

  // --- Web Audio ambient bed (soft pad + gentle pulse) ---
  const audioRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAudioBed = useCallback(() => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      audioRef.current = ctx
      const master = ctx.createGain()
      master.gain.value = mutedRef.current ? 0 : 0.16
      master.connect(ctx.destination)
      masterRef.current = master

      // Warm pad: two detuned oscillators through a low-pass filter.
      const filter = ctx.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.value = 700
      filter.connect(master)
      const padGain = ctx.createGain()
      padGain.gain.value = 0.5
      padGain.connect(filter)
      ;[110, 164.81].forEach((f, i) => {
        const osc = ctx.createOscillator()
        osc.type = "sine"
        osc.frequency.value = f
        osc.detune.value = i === 0 ? -6 : 6
        osc.connect(padGain)
        osc.start()
      })

      // Gentle rhythmic pulse to feel dynamic/modern.
      pulseTimerRef.current = setInterval(() => {
        if (!audioRef.current) return
        const t = audioRef.current.currentTime
        const g = audioRef.current.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
        g.connect(master)
        const o = audioRef.current.createOscillator()
        o.type = "triangle"
        o.frequency.setValueAtTime(150, t)
        o.frequency.exponentialRampToValueAtTime(60, t + 0.25)
        o.connect(g)
        o.start(t)
        o.stop(t + 0.3)
      }, 545) // ~110 BPM
    } catch {
      // Audio not available — silent fallback.
    }
  }, [])

  const stopAudioBed = useCallback(() => {
    if (pulseTimerRef.current) clearInterval(pulseTimerRef.current)
    pulseTimerRef.current = null
    if (audioRef.current) {
      audioRef.current.close().catch(() => {})
      audioRef.current = null
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (mutedRef.current) return
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      const u = new SpeechSynthesisUtterance(text)
      u.lang = "fr-FR"
      u.rate = 1.06
      u.pitch = 1
      const fr = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith("fr"))
      if (fr) u.voice = fr
      synth.speak(u)
    } catch {
      // Speech synthesis not available.
    }
  }, [])

  const tick = useCallback((now: number) => {
    const e = now - startTsRef.current
    if (e >= TOTAL) {
      setElapsed(TOTAL)
      setPlaying(false)
      stopAudioBed()
      return
    }
    setElapsed(e)
    rafRef.current = requestAnimationFrame(tick)
  }, [stopAudioBed])

  const play = useCallback(() => {
    // Warm up voices (some browsers load them lazily).
    try {
      window.speechSynthesis?.getVoices()
      window.speechSynthesis?.cancel()
    } catch {
      /* noop */
    }
    spokenRef.current = null
    setStarted(true)
    setPlaying(true)
    startTsRef.current = performance.now()
    setElapsed(0)
    stopAudioBed()
    startAudioBed()
    rafRef.current = requestAnimationFrame(tick)
  }, [tick, startAudioBed, stopAudioBed])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      mutedRef.current = next
      if (masterRef.current && audioRef.current) {
        masterRef.current.gain.setTargetAtTime(next ? 0 : 0.16, audioRef.current.currentTime, 0.05)
      }
      if (next) window.speechSynthesis?.cancel()
      return next
    })
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      stopAudioBed()
      try {
        window.speechSynthesis?.cancel()
      } catch {
        /* noop */
      }
    }
  }, [stopAudioBed])

  const current = SCENES.find((s) => elapsed >= s.start && elapsed < s.end)?.id ?? "cta"

  // Speak the voice-over once when a scene becomes active.
  useEffect(() => {
    if (!playing) return
    if (spokenRef.current !== current && VOICE[current]) {
      spokenRef.current = current
      speak(VOICE[current])
    }
  }, [current, playing, speak])

  const progress = Math.min(100, (elapsed / TOTAL) * 100)

  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#0a0e1f] text-white">
      {/* Ambient brand glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[42rem] w-[42rem] rounded-full bg-[oklch(0.52_0.18_264)] opacity-25 blur-[140px]" />
        <div className="absolute -right-40 bottom-0 h-[38rem] w-[38rem] rounded-full bg-[oklch(0.64_0.13_195)] opacity-20 blur-[140px]" />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* 16:9 stage */}
      <div className="relative mx-auto flex aspect-video w-full max-w-6xl items-center justify-center px-10">
        {!started ? (
          <StartCard onPlay={play} />
        ) : (
          <>
            {current === "intro" && <SceneIntro />}
            {current === "probleme" && <SceneProbleme />}
            {current === "solution" && <SceneSolution />}
            {current === "apercu" && <SceneApercu />}
            {current === "process" && <SceneProcess />}
            {current === "chiffres" && <SceneChiffres />}
            {current === "cta" && <SceneCta replay={play} finished={elapsed >= TOTAL} />}
          </>
        )}
      </div>

      {/* Progress bar */}
      {started && (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/10">
          <div
            className="h-full bg-[oklch(0.64_0.13_195)] transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Brand watermark */}
      {started && (
        <div className="absolute left-8 top-7 flex items-center gap-2.5 opacity-90">
          <BrandMark className="size-8" />
          <span className="text-lg font-semibold tracking-tight">SIGS</span>
        </div>
      )}

      {/* Mute toggle */}
      {started && (
        <button
          onClick={toggleMute}
          aria-label={muted ? "Activer le son" : "Couper le son"}
          className="absolute right-8 top-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          {muted ? "Son coupé" : "Son"}
        </button>
      )}

      {/* Replay when finished */}
      {started && !playing && elapsed >= TOTAL && (
        <button
          onClick={play}
          className="absolute right-8 top-16 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
        >
          <RotateCcw className="size-4" /> Rejouer
        </button>
      )}
    </div>
  )
}

function StartCard({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex items-center gap-4">
        <BrandMark className="size-16" />
        <div className="text-left">
          <div className="text-4xl font-bold tracking-tight">SIGS</div>
          <div className="text-sm uppercase tracking-[0.2em] text-white/60">Gestion de Services</div>
        </div>
      </div>
      <p className="max-w-md text-balance text-lg text-white/70">
        Présentation animée avec voix off — 30 secondes. Passez en plein écran, montez le son, puis lancez pour
        enregistrer.
      </p>
      <button
        onClick={onPlay}
        className="inline-flex items-center gap-3 rounded-full bg-[oklch(0.64_0.13_195)] px-8 py-4 text-lg font-semibold text-[#06121a] shadow-2xl transition hover:brightness-110"
      >
        <Play className="size-5 fill-current" /> Lancer la vidéo
      </button>
      <p className="text-xs text-white/40">Astuce : la voix off utilise la synthèse vocale de votre navigateur.</p>
    </div>
  )
}

function SceneIntro() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="animate-fade-in flex items-center gap-5">
        <BrandMark className="size-20 animate-float" />
      </div>
      <h1 className="animate-fade-up delay-100 text-6xl font-bold leading-tight tracking-tight text-balance">
        Gérez vos dossiers.
        <br />
        <span className="text-[oklch(0.7_0.13_195)]">Sans le papier.</span>
      </h1>
      <p className="animate-fade-up delay-300 max-w-xl text-balance text-xl text-white/70">
        La plateforme tout-en-un pour les agences et cabinets de Kinshasa.
      </p>
    </div>
  )
}

function SceneProbleme() {
  const pains = [
    { icon: Clock, label: "Files d'attente interminables" },
    { icon: FileText, label: "Dossiers papier égarés" },
    { icon: BarChart3, label: "Aucune visibilité sur l'avancement" },
  ]
  return (
    <div className="flex w-full flex-col items-center gap-10 text-center">
      <h2 className="animate-fade-up text-4xl font-bold tracking-tight text-balance">
        Les démarches administratives, <span className="text-white/50">c&apos;est le chaos ?</span>
      </h2>
      <div className="flex flex-wrap items-stretch justify-center gap-5">
        {pains.map((p, i) => (
          <div
            key={p.label}
            className="animate-fade-up flex w-64 flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-7"
            style={{ animationDelay: `${0.15 * (i + 1)}s` }}
          >
            <p.icon className="size-9 text-[oklch(0.7_0.15_25)]" />
            <span className="text-lg text-white/80 text-pretty">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneSolution() {
  const features = [
    { icon: FolderKanban, title: "Dossiers centralisés", desc: "Clients, documents et statuts en un seul endroit." },
    { icon: Workflow, title: "Processus automatisés", desc: "Des étapes standardisées et réutilisables." },
    { icon: QrCode, title: "Suivi par QR code", desc: "Vos clients suivent l'avancement en temps réel." },
    { icon: ShieldCheck, title: "Sécurité & rôles", desc: "Accès contrôlés, données protégées." },
  ]
  return (
    <div className="flex w-full flex-col items-center gap-9">
      <h2 className="animate-fade-up text-4xl font-bold tracking-tight text-balance text-center">
        SIGS met de l&apos;ordre. <span className="text-[oklch(0.7_0.13_195)]">Automatiquement.</span>
      </h2>
      <div className="grid w-full max-w-4xl grid-cols-2 gap-5">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="animate-fade-up flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            style={{ animationDelay: `${0.12 * (i + 1)}s` }}
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.52_0.18_264)]/30">
              <f.icon className="size-6 text-[oklch(0.72_0.13_264)]" />
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold">{f.title}</div>
              <div className="text-sm text-white/60 text-pretty">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SHOTS = [
  { src: "/promo/dashboard.png", label: "Tableau de bord" },
  { src: "/promo/dossiers.png", label: "Dossiers" },
  { src: "/promo/process.png", label: "Processus" },
  { src: "/promo/analytics.png", label: "Analyses" },
  { src: "/promo/taches.png", label: "Tâches" },
]

function SceneApercu() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SHOTS.length), 1150)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <h2 className="animate-fade-up text-3xl font-bold tracking-tight text-balance text-center">
        Une seule plateforme, <span className="text-[oklch(0.7_0.13_195)]">tout ce qu&apos;il vous faut.</span>
      </h2>

      {/* Browser frame */}
      <div className="animate-fade-up w-full max-w-4xl overflow-hidden rounded-2xl border border-white/12 bg-[#0d1226] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-3">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <div className="ml-3 flex-1 rounded-md bg-white/[0.06] px-3 py-1 text-xs text-white/50">
            sigs.app / {SHOTS[idx].label.toLowerCase()}
          </div>
        </div>
        <div className="relative aspect-[1440/900] w-full bg-[#0a0e1f]">
          {SHOTS.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.src}
              src={s.src || "/placeholder.svg"}
              alt={`Aperçu — ${s.label}`}
              className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
              style={{ opacity: i === idx ? 1 : 0 }}
            />
          ))}
        </div>
      </div>

      {/* Section chips */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {SHOTS.map((s, i) => (
          <span
            key={s.label}
            className={
              "rounded-full border px-4 py-1.5 text-sm transition " +
              (i === idx
                ? "border-[oklch(0.64_0.13_195)]/50 bg-[oklch(0.64_0.13_195)]/15 text-white"
                : "border-white/10 bg-white/[0.03] text-white/55")
            }
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function SceneProcess() {
  const steps = ["Dépôt du dossier", "Traitement & étapes", "Validation", "Remise au client"]
  return (
    <div className="flex w-full flex-col items-center gap-10">
      <h2 className="animate-fade-up text-4xl font-bold tracking-tight text-balance text-center">
        Chaque étape suivie, <span className="text-[oklch(0.7_0.13_195)]">de A à Z.</span>
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className="animate-fade-up flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3"
              style={{ animationDelay: `${0.2 * i}s` }}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-[oklch(0.64_0.13_195)] text-sm font-bold text-[#06121a]">
                {i + 1}
              </span>
              <span className="text-base font-medium text-white/85">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight
                className="animate-fade-in size-5 text-white/30"
                style={{ animationDelay: `${0.2 * i + 0.1}s` }}
              />
            )}
          </div>
        ))}
      </div>
      <div
        className="animate-fade-up flex items-center gap-3 rounded-2xl border border-[oklch(0.64_0.13_195)]/30 bg-[oklch(0.64_0.13_195)]/10 px-6 py-4"
        style={{ animationDelay: "0.9s" }}
      >
        <QrCode className="size-7 text-[oklch(0.7_0.13_195)]" />
        <span className="text-lg text-white/85 text-pretty">
          Le client scanne, et voit l&apos;avancement — <strong>sans se déplacer.</strong>
        </span>
      </div>
    </div>
  )
}

function SceneChiffres() {
  const stats = [
    { value: "3x", label: "plus rapide à traiter" },
    { value: "100%", label: "des dossiers tracés" },
    { value: "0", label: "papier égaré" },
  ]
  return (
    <div className="flex w-full flex-col items-center gap-12">
      <h2 className="animate-fade-up text-4xl font-bold tracking-tight text-balance text-center">
        Des résultats concrets.
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="animate-fade-up flex w-64 flex-col items-center gap-2 rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-10"
            style={{ animationDelay: `${0.18 * (i + 1)}s` }}
          >
            <CheckCircle2 className="mb-2 size-8 text-[oklch(0.7_0.14_160)]" />
            <div className="text-6xl font-bold tracking-tight text-[oklch(0.72_0.13_264)]">{s.value}</div>
            <div className="text-center text-base text-white/70 text-pretty">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneCta({ replay, finished }: { replay: () => void; finished: boolean }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="animate-fade-in flex items-center gap-4">
        <BrandMark className="size-16" />
        <div className="text-left">
          <div className="text-4xl font-bold tracking-tight">SIGS</div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/60">Gestion de Services</div>
        </div>
      </div>
      <h2 className="animate-fade-up delay-100 text-5xl font-bold leading-tight tracking-tight text-balance">
        Passez au numérique <span className="text-[oklch(0.7_0.13_195)]">dès aujourd&apos;hui.</span>
      </h2>
      <div className="animate-fade-up delay-300 flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-3 rounded-full bg-[oklch(0.64_0.13_195)] px-8 py-4 text-lg font-semibold text-[#06121a]">
          Demandez votre démo gratuite
        </div>
        <div className="text-base text-white/60">Kinshasa • RD Congo</div>
      </div>
      {finished && (
        <button
          onClick={replay}
          className="animate-fade-in mt-2 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80"
        >
          <RotateCcw className="size-4" /> Rejouer la vidéo
        </button>
      )}
    </div>
  )
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={
        "flex items-center justify-center rounded-2xl bg-[oklch(0.52_0.18_264)] text-white shadow-lg " + (className ?? "")
      }
    >
      <FolderKanban className="size-1/2" />
    </div>
  )
}
