"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DeleteButton({
  action,
  redirectTo,
  label = "Supprimer",
  title = "Confirmer la suppression",
  description = "Cette action est irréversible.",
}: {
  action: () => Promise<void>
  redirectTo?: string
  label?: string
  title?: string
  description?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onConfirm() {
    startTransition(async () => {
      try {
        await action()
        toast.success("Supprimé avec succès.")
        setOpen(false)
        if (redirectTo) router.push(redirectTo)
        else router.refresh()
      } catch {
        toast.error("Suppression impossible.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({ variant: "outline", size: "sm" }) + " text-destructive hover:text-destructive"}
      >
        <Trash2 className="size-4" /> {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
