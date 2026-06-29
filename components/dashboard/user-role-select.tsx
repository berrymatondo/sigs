"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLES, roleLabels } from "@/lib/domain"
import { updateUserRole } from "@/app/dashboard/administration/actions"
import type { AppRole } from "@/lib/auth"

export function UserRoleSelect({
  id,
  role,
  disabled,
}: {
  id: string
  role: string
  disabled?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onChange(value: string) {
    startTransition(async () => {
      try {
        await updateUserRole(id, value as AppRole)
        toast.success("Rôle mis à jour.")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Mise à jour impossible.")
      }
    })
  }

  return (
    <Select value={role} onValueChange={onChange} disabled={pending || disabled}>
      <SelectTrigger className="h-8 w-40 text-xs">
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
  )
}
