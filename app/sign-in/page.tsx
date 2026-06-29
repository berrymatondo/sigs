import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AuthForm } from "@/components/auth-form"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectTo } = await searchParams
  const session = await getSession()
  if (session?.user) redirect(redirectTo || "/dashboard")
  return <AuthForm mode="sign-in" redirectTo={redirectTo} />
}
