import { redirect } from "next/navigation"
import { getSession, isPendingOtp } from "@/lib/session"
import { VerifyOtpForm } from "@/components/verify-otp-form"

export default async function VerifyOtpPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  if (!(await isPendingOtp())) redirect("/dashboard")
  return <VerifyOtpForm email={session.user.email} />
}
