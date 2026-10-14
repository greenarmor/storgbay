"use client";

import { FormEvent, useState } from "react";

const CONFIRMATION =
  "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder. If your account has no email delivery configured, ask an administrator for a reset link.";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) {
      setError("Enter the email address for your account.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Unable to process that request.");
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="auth-form">
        <p role="status" style={{ margin: 0 }}>
          {CONFIRMATION}
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@studio.com" required />
      </div>
      {error ? (
        <p role="alert" className="auth-error">
          {error}
        </p>
      ) : null}
      <button type="submit" className="auth-submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
