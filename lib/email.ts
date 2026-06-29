import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { formatClientName } from "@/lib/domain"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SIGS <onboarding@resend.dev>"

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log("[v0] RESEND_API_KEY manquante — email ignoré")
    return null
  }
  return new Resend(apiKey)
}

/**
 * Returns the list of administrator email addresses.
 */
async function getAdminEmails() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", banned: false },
    select: { email: true },
  })
  return admins.map((a) => a.email).filter((e): e is string => Boolean(e))
}

type DossierForEmail = {
  numero: string
  nom: string
  client: { nom: string; postnom?: string | null; prenom?: string | null }
}

function emailLayout(title: string, intro: string, dossier: DossierForEmail) {
  const clientName = formatClientName(dossier.client)
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="margin: 0 0 8px; font-size: 18px;">${title}</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">${intro}</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Référence</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${dossier.numero}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Intitulé</td>
        <td style="padding: 8px 0; text-align: right;">${dossier.nom}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Client</td>
        <td style="padding: 8px 0; text-align: right;">${clientName}</td>
      </tr>
    </table>
  </div>`
}

async function notifyAdmins(subject: string, html: string) {
  const resend = getResend()
  if (!resend) return
  const recipients = await getAdminEmails()
  if (recipients.length === 0) {
    console.log("[v0] Aucun administrateur à notifier")
    return
  }
  try {
    await resend.emails.send({ from: FROM_EMAIL, to: recipients, subject, html })
  } catch (error) {
    console.log("[v0] Échec de l'envoi de l'email Resend:", (error as Error).message)
  }
}

/**
 * Sends an email with the freshly created account credentials to the new user.
 * Returns true when the email was actually dispatched, false otherwise (e.g.
 * Resend is not configured or the send failed) so callers can adapt their UI.
 */
export async function sendNewUserCredentials(params: {
  name: string
  email: string
  password: string
  roleLabel: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const loginUrl = `${(process.env.BETTER_AUTH_URL || process.env.V0_RUNTIME_URL || "").replace(/\/$/, "")}/sign-in`
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="margin: 0 0 8px; font-size: 18px;">Votre compte SIGS a été créé</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
      Bonjour ${params.name}, un compte vient d'être créé pour vous avec le rôle
      <strong>${params.roleLabel}</strong>. Voici vos identifiants de connexion&nbsp;:
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Identifiant (email)</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${params.email}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Mot de passe</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${params.password}</td>
      </tr>
    </table>
    ${
      loginUrl
        ? `<p style="margin: 0 0 16px; font-size: 14px;">
             <a href="${loginUrl}" style="display: inline-block; background: #1f2937; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 14px;">Se connecter</a>
           </p>`
        : ""
    }
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      Pour des raisons de sécurité, nous vous recommandons de modifier votre mot de passe après votre première connexion.
    </p>
  </div>`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: "Vos identifiants de connexion SIGS",
      html,
    })
    return true
  } catch (error) {
    console.log("[v0] Échec de l'envoi des identifiants Resend:", (error as Error).message)
    return false
  }
}

/**
 * Sends a freshly generated password to a user who requested a reset from the
 * "mot de passe oublié" page. Returns true when the email was dispatched.
 */
export async function sendSelfServiceResetCredentials(params: {
  name: string
  email: string
  password: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.log("[v0] Mot de passe réinitialisé (Resend non configuré) pour", params.email)
    return false
  }

  const loginUrl = `${(process.env.BETTER_AUTH_URL || process.env.V0_RUNTIME_URL || "").replace(/\/$/, "")}/sign-in`
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="margin: 0 0 8px; font-size: 18px;">Votre nouveau mot de passe</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
      Bonjour ${params.name}, vous avez demandé la réinitialisation de votre mot de passe SIGS.
      Voici vos nouveaux identifiants de connexion&nbsp;:
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Identifiant (email)</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${params.email}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Nouveau mot de passe</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${params.password}</td>
      </tr>
    </table>
    ${
      loginUrl
        ? `<p style="margin: 0 0 16px; font-size: 14px;">
             <a href="${loginUrl}" style="display: inline-block; background: #1f2937; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 14px;">Se connecter</a>
           </p>`
        : ""
    }
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      Si vous n'êtes pas à l'origine de cette demande, contactez un administrateur.
      Nous vous recommandons de modifier ce mot de passe après votre prochaine connexion.
    </p>
  </div>`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: "Votre nouveau mot de passe SIGS",
      html,
    })
    return true
  } catch (error) {
    console.log("[v0] Échec de l'envoi du nouveau mot de passe:", (error as Error).message)
    return false
  }
}

/**
 * Sends the new password to a user after an administrator reset it manually.
 * Returns true when the email was dispatched.
 */
export async function sendAdminResetCredentials(params: {
  name: string
  email: string
  password: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.log("[v0] Mot de passe réinitialisé (Resend non configuré) pour", params.email)
    return false
  }

  const loginUrl = `${(process.env.BETTER_AUTH_URL || process.env.V0_RUNTIME_URL || "").replace(/\/$/, "")}/sign-in`
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="margin: 0 0 8px; font-size: 18px;">Votre mot de passe a été réinitialisé</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
      Bonjour ${params.name}, un administrateur a réinitialisé votre mot de passe SIGS.
      Voici vos nouveaux identifiants de connexion&nbsp;:
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Identifiant (email)</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${params.email}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Nouveau mot de passe</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${params.password}</td>
      </tr>
    </table>
    ${
      loginUrl
        ? `<p style="margin: 0 0 16px; font-size: 14px;">
             <a href="${loginUrl}" style="display: inline-block; background: #1f2937; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 14px;">Se connecter</a>
           </p>`
        : ""
    }
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      Pour des raisons de sécurité, nous vous recommandons de modifier ce mot de passe après votre prochaine connexion.
    </p>
  </div>`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: "Votre mot de passe SIGS a été réinitialisé",
      html,
    })
    return true
  } catch (error) {
    console.log("[v0] Échec de l'envoi du nouveau mot de passe:", (error as Error).message)
    return false
  }
}

/**
 * Sends a password reset link to the user. The `url` is generated by Better
 * Auth and carries the one-time reset token. Returns true when sent.
 */
export async function sendPasswordReset(params: {
  name?: string | null
  email: string
  url: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    // Surface the reset link in the logs when email is not configured so the
    // flow remains testable in development.
    console.log("[v0] Lien de réinitialisation (Resend non configuré):", params.url)
    return false
  }

  const greeting = params.name ? `Bonjour ${params.name},` : "Bonjour,"
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="margin: 0 0 8px; font-size: 18px;">Réinitialisation de votre mot de passe</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
      ${greeting} vous avez demandé à réinitialiser votre mot de passe SIGS.
      Cliquez sur le bouton ci-dessous pour en définir un nouveau&nbsp;:
    </p>
    <p style="margin: 0 0 16px; font-size: 14px;">
      <a href="${params.url}" style="display: inline-block; background: #1f2937; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 14px;">Réinitialiser mon mot de passe</a>
    </p>
    <p style="margin: 0 0 16px; font-size: 12px; color: #6b7280; word-break: break-all;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br />${params.url}
    </p>
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
    </p>
  </div>`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: "Réinitialisation de votre mot de passe SIGS",
      html,
    })
    return true
  } catch (error) {
    console.log("[v0] Échec de l'envoi de l'email de réinitialisation:", (error as Error).message)
    return false
  }
}

/**
 * Sends a welcome email to a visitor who just created their account through the
 * public sign-up form. Returns true when the email was actually dispatched.
 */
export async function sendWelcomeEmail(params: {
  name?: string | null
  email: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.log("[v0] Email de bienvenue ignoré (Resend non configuré) pour", params.email)
    return false
  }

  const baseUrl = (process.env.BETTER_AUTH_URL || process.env.V0_RUNTIME_URL || "").replace(/\/$/, "")
  const dashboardUrl = baseUrl ? `${baseUrl}/dashboard` : ""
  const greeting = params.name ? `Bonjour ${params.name},` : "Bonjour,"
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="margin: 0 0 8px; font-size: 18px;">Bienvenue chez SIGS&nbsp;!</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
      ${greeting} votre compte SIGS a bien été créé. Vous pouvez dès maintenant
      vous connecter à votre espace personnel pour suivre l'avancement de vos
      dossiers en temps réel.
    </p>
    ${
      dashboardUrl
        ? `<p style="margin: 0 0 16px; font-size: 14px;">
             <a href="${dashboardUrl}" style="display: inline-block; background: #1f2937; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 14px;">Accéder à mon espace</a>
           </p>`
        : ""
    }
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.
    </p>
  </div>`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: "Bienvenue chez SIGS",
      html,
    })
    return true
  } catch (error) {
    console.log("[v0] Échec de l'envoi de l'email de bienvenue:", (error as Error).message)
    return false
  }
}

// Escapes user-provided text before injecting it into the HTML email body.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Handles a public contact form submission:
 *  - sends the message to the company contact email
 *  - sends an acknowledgement ("accusé de réception") to the visitor
 * Returns true when at least the company notification was dispatched.
 */
export async function sendContactEmails(params: {
  nom: string
  email: string
  telephone?: string
  sujet: string
  message: string
  companyEmail: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.log("[v0] Emails de contact ignorés (Resend non configuré) pour", params.email)
    return false
  }

  const nom = escapeHtml(params.nom)
  const email = escapeHtml(params.email)
  const telephone = params.telephone ? escapeHtml(params.telephone) : "—"
  const sujet = escapeHtml(params.sujet)
  const messageHtml = escapeHtml(params.message).replace(/\n/g, "<br />")

  const companyHtml = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="margin: 0 0 8px; font-size: 18px;">Nouveau message de contact</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
      Un message a été envoyé depuis le formulaire de contact du site.
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 6px 0; color: #6b7280;">Nom</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${nom}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Email</td><td style="padding: 6px 0; text-align: right;">${email}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Téléphone</td><td style="padding: 6px 0; text-align: right;">${telephone}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Sujet</td><td style="padding: 6px 0; text-align: right;">${sujet}</td></tr>
    </table>
    <div style="margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 8px; font-size: 14px; line-height: 1.5;">${messageHtml}</div>
  </div>`

  const ackHtml = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="margin: 0 0 8px; font-size: 18px;">Nous avons bien reçu votre message</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
      Bonjour ${nom}, merci de nous avoir contactés. Notre équipe vous répondra dans les meilleurs délais.
      Voici un récapitulatif de votre demande :
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 6px 0; color: #6b7280;">Sujet</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${sujet}</td></tr>
    </table>
    <div style="margin-top: 12px; padding: 12px; background: #f3f4f6; border-radius: 8px; font-size: 14px; line-height: 1.5;">${messageHtml}</div>
    <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">Ceci est un accusé de réception automatique, merci de ne pas y répondre.</p>
  </div>`

  let companySent = false
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.companyEmail,
      replyTo: params.email,
      subject: `Contact — ${params.sujet}`,
      html: companyHtml,
    })
    companySent = true
  } catch (error) {
    console.log("[v0] Échec de l'envoi du message de contact à l'entreprise:", (error as Error).message)
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: "Accusé de réception — SIGS",
      html: ackHtml,
    })
  } catch (error) {
    console.log("[v0] Échec de l'envoi de l'accusé de réception:", (error as Error).message)
  }

  return companySent
}

/**
 * Notify administrators that a new dossier has been created.
 */
export async function notifyDossierCreated(dossier: DossierForEmail) {
  const subject = `Nouveau dossier créé — ${dossier.numero}`
  const html = emailLayout(
    "Nouveau dossier créé",
    "Un nouveau dossier vient d'être enregistré dans le système.",
    dossier,
  )
  await notifyAdmins(subject, html)
}

/**
 * Notify administrators that a dossier has been closed.
 */
export async function notifyDossierCloture(dossier: DossierForEmail) {
  const subject = `Dossier clôturé — ${dossier.numero}`
  const html = emailLayout(
    "Dossier clôturé",
    "Le dossier suivant a été clôturé (statut Terminé).",
    dossier,
  )
  await notifyAdmins(subject, html)
}
