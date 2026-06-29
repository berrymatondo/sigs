import { ResetPasswordForm } from "@/components/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  // Better Auth redirects here with `?token=...` on success, or `?error=...`
  // (e.g. INVALID_TOKEN) when the link is invalid or expired.
  const { token, error } = await searchParams
  return <ResetPasswordForm token={token} tokenError={error} />
}
