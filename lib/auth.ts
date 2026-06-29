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
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  // The app runs inside a cross-site iframe (v0 preview, Vercel deployment
  // preview). Browsers only send the session cookie back in that context when
  // it is SameSite=None; Secure, AND modern browsers (Chrome) block third-party
  // cookies in iframes unless they carry the Partitioned attribute (CHIPS).
  // Without `partitioned`, the cookie is dropped and the user is bounced back to
  // the sign-in page after a successful login.
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none" as const,
      secure: true,
      partitioned: true,
    },
  },
})

export type AppRole = "VISITEUR" | "AGENT" | "MANAGER" | "ADMIN"
