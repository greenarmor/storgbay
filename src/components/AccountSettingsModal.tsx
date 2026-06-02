"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

type AccountSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  userEmail?: string | null;
};

export function AccountSettingsModal({ open, onClose, userEmail }: AccountSettingsModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteStep, setDeleteStep] = useState(0);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setShowDeleteConfirm(false);
      setDeletePassword("");
      setDeleting(false);
      setDeleteError("");
      setDeleteStep(0);
    }
  }, [open]);

  useEffect(() => {
    if (showDeleteConfirm && deleteInputRef.current) {
      deleteInputRef.current.focus();
    }
  }, [showDeleteConfirm]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `storgbay-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }

    if (!deletePassword) {
      setDeleteError("Password is required.");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!res.ok) {
        const text = await res.text();
        setDeleteError(text || "Failed to delete account.");
        setDeleting(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setDeleteError("An error occurred. Please try again.");
      setDeleting(false);
    }
  }

  if (!isMounted || !open) {
    return null;
  }

  return createPortal(
    <div className="account-settings-backdrop" role="presentation" onClick={onClose}>
      <div
        className="account-settings-window"
        id="account-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Account Settings"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="account-settings-header">
          <div>
            <h2>Account Settings</h2>
            {userEmail && <p className="account-settings-email">Signed in as {userEmail}</p>}
            <p className="account-settings-description">
              Manage your account security and exercise your data protection rights.
            </p>
          </div>
          <button type="button" className="account-settings-close" onClick={onClose} aria-label="Close account settings">
            ×
          </button>
        </header>
        <div className="account-settings-content">
          <section className="account-settings-section">
            <div>
              <h3>Account security</h3>
              <p className="account-settings-section-description">
                Change your password. You can only update your own account details from here.
              </p>
            </div>
            <ChangePasswordForm />
          </section>

          <section className="account-settings-section">
            <div>
              <h3>Data export</h3>
              <p className="account-settings-section-description">
                Download a copy of all your personal data in JSON format. This includes your profile, files, galleries, and gallery memberships.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="account-settings-action-button"
            >
              {exporting ? "Preparing export..." : "Download my data"}
            </button>
          </section>

          <section className="account-settings-section account-settings-section--danger">
            <div>
              <h3>Delete account</h3>
              <p className="account-settings-section-description">
                Permanently delete your account and all associated data, including uploaded files, galleries, and gallery memberships. This action cannot be undone.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="account-settings-danger-button"
              >
                Delete my account
              </button>
            ) : (
              <div className="account-settings-delete-confirm">
                {deleteStep === 0 ? (
                  <>
                    <p className="account-settings-delete-warning">
                      This will permanently delete your account, all your files, galleries, and associated data. Are you sure?
                    </p>
                    <div className="account-settings-delete-actions">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="account-settings-cancel-button"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="account-settings-danger-button"
                      >
                        Yes, continue
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="account-settings-delete-warning">
                      Enter your password to confirm permanent account deletion.
                    </p>
                    <input
                      ref={deleteInputRef}
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your password"
                      className="account-settings-input"
                      autoComplete="current-password"
                    />
                    {deleteError && (
                      <p className="account-settings-error">{deleteError}</p>
                    )}
                    <div className="account-settings-delete-actions">
                      <button
                        type="button"
                        onClick={() => { setDeleteStep(0); setDeletePassword(""); setDeleteError(""); }}
                        disabled={deleting}
                        className="account-settings-cancel-button"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleting || !deletePassword}
                        className="account-settings-danger-button"
                      >
                        {deleting ? "Deleting..." : "Permanently delete"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
