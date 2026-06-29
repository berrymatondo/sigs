"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ROLES, roleLabels } from "@/lib/domain"
import type { AppRole } from "@/lib/auth"
import { createUser, updateUser } from "@/app/dashboard/administration/actions"

type UserData = {
  id: string
  name: string
  email: string
  phone: string | null
  role: AppRole
}

export function UserFormDialog({
  mode,
  user,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  mode: "create" | "edit"
  user?: UserData
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = (o: boolean) => {
    if (!isControlled) setUncontrolledOpen(o)
    onOpenChange?.(o)
  }
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<AppRole>(user?.role ?? "VISITEUR")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function reset() {
    if (mode === "create") {
      setName("")
      setEmail("")
      setPhone("")
      setRole("VISITEUR")
    }
    setPassword("")
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const payload = { name, email, phone, role, password }
        if (mode === "create") {
          const result = await createUser(payload)
          toast.success(
            result?.emailSent
              ? "Utilisateur créé. Ses identifiants ont été envoyés par email."
              : "Utilisateur créé. (Email non envoyé : vérifiez la configuration Resend.)",
          )
        } else if (user) {
          await updateUser(user.id, payload)
          toast.success("Utilisateur mis à jour.")
        }
        setOpen(false)
        reset()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action impossible.")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Créez un compte et attribuez-lui un rôle."
                : "Mettez à jour les informations et le rôle de ce compte."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nom complet</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@exemple.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">Téléphone</Label>
              <Input
                id="user-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
            {mode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="user-password">Mot de passe (optionnel)</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Laisser vide pour en générer un automatiquement"
                />
                <p className="text-xs text-muted-foreground">
                  Les identifiants (email et mot de passe) seront envoyés par email à l&apos;utilisateur.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user-role">Rôle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Enregistrement..."
                : mode === "create"
                  ? "Créer l'utilisateur"
                  : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
