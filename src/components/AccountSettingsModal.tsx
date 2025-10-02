"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

type AccountSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  userEmail?: string | null;
};

export function AccountSettingsModal({ open, onClose, userEmail }: AccountSettingsModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
              Manage your account security and update your password without leaving your current view.
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
        </div>
      </div>
    </div>,
    document.body
  );
}
