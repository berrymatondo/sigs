import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"
import { sendPasswordReset } from "@/lib/email"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // Triggered when a user requests a password reset. Better Auth builds the
    // reset URL (pointing at the `redirectTo` page with a one-time token) and we
    // email it to the user.
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordReset({ name: user.name, email: user.email, url })
    },
    // The reset token stays valid for one hour.
    resetPasswordTokenExpiresIn: 60 * 60,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "VISITEUR",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    // v0 preview + Vercel deployment domains (the iframe origin can differ from baseURL)
    "https://*.vusercontent.net",
    "https://*.v0.dev",
    "https://*.vercel.app",
    "http://localhost:3000",
  ],
  // SameSite=None + Partitioned was previously forced here to keep the
  // session cookie alive inside the v0.dev preview iframe. But `VERCEL=1` (the
  // only reliable way to detect "really running on Vercel") is set for every
  // Vercel environment, preview iframe or not, so that override also applied
  // to normal top-level visits on the real domain — where Safari/WebKit
  // doesn't persist a SameSite=None; Secure cookie for a plain (non-iframe)
  // navigation. Users saw "Connexion réussie" and were bounced straight back
  // to /sign-in. The default (Lax) cookie works everywhere sign-in actually
  // matters, so we no longer override it; the v0 preview iframe is a
  // dev-tooling concern, not a real user path.
})

export type AppRole = "VISITEUR" | "AGENT" | "MANAGER" | "ADMIN"
