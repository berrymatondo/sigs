import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ForgotPasswordForm } from "@/components/forgot-password-form"

export default async function ForgotPasswordPage() {
  const session = await getSession()
  if (session?.user) redirect("/dashboard")
  return <ForgotPasswordForm />
}
