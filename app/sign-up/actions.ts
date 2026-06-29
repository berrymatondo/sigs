"use server"

import { sendWelcomeEmail } from "@/lib/email"

/**
 * Sends a welcome email after a visitor signs up through the public form.
 * Best-effort: never throws so a mail failure can't break the sign-up flow.
 */
export async function sendWelcomeEmailAction(params: { name?: string | null; email: string }) {
  try {
    await sendWelcomeEmail({ name: params.name, email: params.email })
  } catch (error) {
    console.log("[v0] sendWelcomeEmailAction a échoué:", (error as Error).message)
  }
}
