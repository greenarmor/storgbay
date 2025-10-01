"use client";

import { FormEvent, useState } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetMessages() {
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to update password.");
      }

      setFeedback("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 12,
        maxWidth: 420,
        background: "var(--drive-surface)",
        border: "1px solid var(--drive-border)",
        borderRadius: "var(--drive-radius-md)",
        padding: 16,
      }}
    >
      <h3 style={{ margin: 0 }}>Change password</h3>
      <p style={{ margin: 0, color: "var(--drive-muted)", fontSize: 14 }}>
        Update your password. This only affects your own account.
      </p>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontWeight: 600 }}>Current password</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          minLength={6}
        />
      </label>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontWeight: 600 }}>New password</span>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={6}
        />
      </label>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontWeight: 600 }}>Confirm new password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={6}
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save password"}
      </button>
      {(feedback || error) && (
        <p
          style={{
            margin: 0,
            color: error ? "var(--drive-error-text)" : "var(--drive-success-text)",
            fontSize: 14,
          }}
        >
          {error ?? feedback}
        </p>
      )}
    </form>
  );
}
