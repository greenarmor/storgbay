import { escapeHtml, sendMail, type MailResult } from "@/lib/mail";
import { appUrl } from "@/lib/app-url";

export const PRODUCT_NAME = "Storgbay";

/**
 * Every email the application can send. Adding a kind here forces the switch in
 * `render` to handle it, so no event can silently render an empty message.
 */
export type NotificationEvent =
  | { kind: "password.reset_link"; to: string; resetUrl: string; expiresInMinutes: number }
  | { kind: "password.reset"; to: string; request?: Request }
  | { kind: "password.changed"; to: string; request?: Request }
  | {
      kind: "gallery.shared";
      to: string;
      galleryTitle: string;
      galleryId: string;
      sharedBy: string;
      request?: Request;
    }
  | { kind: "account.created"; to: string; role: string; request?: Request }
  | {
      /** Admin created the account without a password and sent a set-password link. */
      kind: "account.invited";
      to: string;
      role: string;
      inviteUrl: string;
      expiresInMinutes: number;
    };

type Rendered = { subject: string; text: string; html: string };

function layout(heading: string, paragraphs: string[], action?: { label: string; href: string }) {
  const body = paragraphs.map((line) => `<p style="margin:0 0 16px;line-height:1.5">${line}</p>`).join("");
  const button = action
    ? `<p style="margin:24px 0"><a href="${action.href}" style="background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${escapeHtml(action.label)}</a></p>` +
      `<p style="margin:0 0 16px;color:#666;font-size:13px">Or paste this into your browser:<br><span style="word-break:break-all">${escapeHtml(action.href)}</span></p>`
    : "";
  return (
    `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#222">` +
    `<div style="max-width:560px;margin:0 auto;background:#fff;padding:28px;border-radius:10px">` +
    `<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(heading)}</h1>${body}${button}` +
    `<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">` +
    `<p style="margin:0;color:#888;font-size:12px">${PRODUCT_NAME} — sent because this address has an account. ` +
    `If you did not expect it, you can ignore it.</p></div></body></html>`
  );
}

function render(event: NotificationEvent): Rendered {
  switch (event.kind) {
    case "password.reset_link": {
      return {
        subject: `${PRODUCT_NAME}: reset your password`,
        text: [
          `Use this link to choose a new password (valid for ${event.expiresInMinutes} minutes):`,
          "",
          event.resetUrl,
          "",
          "If you did not request this, you can ignore this email.",
        ].join("\n"),
        html: layout(
          "Reset your password",
          [`Use the button below to choose a new password. The link is valid for ${event.expiresInMinutes} minutes.`],
          { label: "Choose a new password", href: event.resetUrl },
        ),
      };
    }

    case "password.reset":
    case "password.changed": {
      const viaLink = event.kind === "password.reset";
      const what = viaLink ? "using a password reset link" : "from your account settings";
      const recoveryUrl = appUrl("/forgot-password", event.request);
      return {
        subject: `${PRODUCT_NAME}: your password was changed`,
        text: [
          `The password for this ${PRODUCT_NAME} account was changed ${what}.`,
          "",
          "If this was you, no action is needed.",
          `If it was not you, reset it immediately: ${recoveryUrl}`,
        ].join("\n"),
        html: layout(
          "Your password was changed",
          [
            `The password for this account was changed ${what}.`,
            "If this was you, no action is needed. If it was not, reset your password immediately.",
          ],
          { label: "Reset your password", href: recoveryUrl },
        ),
      };
    }

    case "gallery.shared": {
      const galleryUrl = appUrl(`/gallery/${event.galleryId}`, event.request);
      const title = escapeHtml(event.galleryTitle);
      const by = escapeHtml(event.sharedBy);
      return {
        subject: `${PRODUCT_NAME}: "${event.galleryTitle}" was shared with you`,
        text: [
          `${event.sharedBy} gave you manager access to the gallery "${event.galleryTitle}".`,
          "",
          `Open it here: ${galleryUrl}`,
        ].join("\n"),
        html: layout(
          "A gallery was shared with you",
          [`<strong>${by}</strong> gave you manager access to <strong>${title}</strong>.`],
          { label: "Open gallery", href: galleryUrl },
        ),
      };
    }

    case "account.invited": {
      const role = escapeHtml(event.role);
      return {
        subject: `You've been invited to ${PRODUCT_NAME}`,
        text: [
          `An account was created for you on ${PRODUCT_NAME} with the role ${event.role}.`,
          "",
          `Choose your own password to get started (link valid for ${event.expiresInMinutes} minutes):`,
          event.inviteUrl,
          "",
          "If you were not expecting this, you can ignore this email.",
        ].join("\n"),
        html: layout(
          `You've been invited to ${PRODUCT_NAME}`,
          [
            `An account was created for you with the role <strong>${role}</strong>.`,
            `Choose your own password to get started — nobody, including administrators, can see it. The link is valid for ${event.expiresInMinutes} minutes.`,
          ],
          { label: "Set your password", href: event.inviteUrl },
        ),
      };
    }

    case "account.created": {
      const signInUrl = appUrl("/forgot-password", event.request);
      const role = escapeHtml(event.role);
      return {
        subject: `${PRODUCT_NAME}: your account is ready`,
        text: [
          `An account was created for you on ${PRODUCT_NAME} with the role ${event.role}.`,
          "",
          "Set your password to sign in:",
          signInUrl,
        ].join("\n"),
        html: layout(
          "Your account is ready",
          [
            `An account was created for you on ${PRODUCT_NAME} with the role <strong>${role}</strong>.`,
            "Choose your own password to sign in — nobody, including administrators, can see it.",
          ],
          { label: "Set your password", href: signInUrl },
        ),
      };
    }
  }
}

/**
 * Renders and sends a notification. Never throws and never rejects, so callers can
 * `void notify(...)` without adding latency to the request they are serving.
 */
export async function notify(event: NotificationEvent): Promise<MailResult> {
  try {
    if (!event.to) return "not-configured";
    const { subject, text, html } = render(event);
    return await sendMail({ to: event.to, subject, text, html });
  } catch (error) {
    console.error("[notify] failed:", error);
    return "failed";
  }
}
