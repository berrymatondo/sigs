import { createHash, randomInt, randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { sendLoginOtpEmail } from "@/lib/email"

const CODE_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

function identifierFor(sessionId: string) {
  return `login-otp:${sessionId}`
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex")
}

/**
 * Generates a fresh 6-digit code for the given session, stores it (hashed)
 * in the Verification table, and emails it to the user. Replaces any
 * previously pending code for that session.
 */
export async function generateAndSendLoginOtp(params: {
  sessionId: string
  userId: string
  email: string
  name?: string | null
}): Promise<boolean> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0")
  const identifier = identifierFor(params.sessionId)

  await prisma.verification.deleteMany({ where: { identifier } })
  await prisma.verification.create({
    data: {
      id: randomUUID(),
      identifier,
      value: `${hashCode(code)}:${MAX_ATTEMPTS}`,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  })

  return sendLoginOtpEmail({ name: params.name, email: params.email, code })
}

export type VerifyLoginOtpResult = "success" | "invalid" | "expired" | "too_many_attempts"

/**
 * Verifies a submitted code against the pending OTP for a session. On
 * success, marks the session as OTP-verified and clears the pending code.
 * On a wrong code, decrements the remaining attempt count; once exhausted,
 * the code is discarded and the user must request a new one.
 */
export async function verifyLoginOtp(sessionId: string, submittedCode: string): Promise<VerifyLoginOtpResult> {
  const identifier = identifierFor(sessionId)
  const record = await prisma.verification.findFirst({ where: { identifier } })
  if (!record) return "invalid"
  if (record.expiresAt < new Date()) {
    await prisma.verification.delete({ where: { id: record.id } })
    return "expired"
  }

  const [storedHash, attemptsLeftRaw] = record.value.split(":")
  const attemptsLeft = Number(attemptsLeftRaw ?? 0)

  if (hashCode(submittedCode) === storedHash) {
    await prisma.$transaction([
      prisma.verification.delete({ where: { id: record.id } }),
      prisma.session.update({ where: { id: sessionId }, data: { otpVerified: true } }),
    ])
    return "success"
  }

  if (attemptsLeft <= 1) {
    await prisma.verification.delete({ where: { id: record.id } })
    return "too_many_attempts"
  }
  await prisma.verification.update({
    where: { id: record.id },
    data: { value: `${storedHash}:${attemptsLeft - 1}` },
  })
  return "invalid"
}
