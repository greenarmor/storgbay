export type MailResult = "sent" | "not-configured" | "failed";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

/**
 * `RESET_EMAIL_FROM` predates the generic mailer and is still honoured so
 * existing deployments keep working unchanged.
 */
export function mailFrom(): string | undefined {
  return process.env.MAIL_FROM ?? process.env.RESET_EMAIL_FROM;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && mailFrom());
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Every user-controlled value (addresses, titles) must pass through this first. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * Sends one message through Resend's HTTPS API. Deliberately no SDK: the request
 * is a plain JSON POST, so no dependency and no supply chain surface is added,
 * and the payload stays inspectable.
 *
 * Returns `"not-configured"` when `RESEND_API_KEY` / `MAIL_FROM` are unset — that
 * is what lets the whole app run without an email provider, with password resets
 * falling back to the admin-mediated link in `/admin`.
 *
 * Never throws: callers get a `MailResult` and decide what to record.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = mailFrom();
  if (!apiKey || !from) return "not-configured";

  // Overridable so the payload can be asserted against a stub endpoint.
  const endpoint = process.env.MAIL_API_URL ?? "https://api.resend.com/emails";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[mail] provider rejected the message (${response.status}): ${detail.slice(0, 500)}`);
      return "failed";
    }

    return "sent";
  } catch (error) {
    console.error("[mail] send failed:", error);
    return "failed";
  }
}
