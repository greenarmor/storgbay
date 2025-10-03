"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccountSettingsButton } from "@/components/AccountSettingsButton";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";

type HeaderActionsProps = {
  sessionUser: AppSessionUser | null;
};

export function HeaderActions({ sessionUser }: HeaderActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const email = sessionUser?.email ?? sessionUser?.name ?? "Account";

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
    setMenuOpen(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <div className="drive-header-actions">
        <ThemeToggle />
        <div className="drive-header-pills" role="list">
          {sessionUser ? (
            <AccountSettingsButton email={email} />
          ) : (
            <span role="listitem" className="drive-pill muted">
              Guest
            </span>
          )}
          {sessionUser ? (
            <a role="listitem" className="drive-pill" href="/api/auth/signout">
              Sign out
            </a>
          ) : (
            <a role="listitem" className="drive-pill" href="/login">
              Sign in
            </a>
          )}
        </div>
        <div className="drive-header-menu" ref={menuRef}>
          <button
            type="button"
            className="drive-header-menu-button"
            onClick={handleToggleMenu}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open account menu"
          >
            <span className="drive-header-menu-icon" aria-hidden>
              ☰
            </span>
          </button>
          {menuOpen && (
            <div className="drive-header-menu-panel" role="menu">
              <div className="drive-header-menu-info" role="none">
                <span className="drive-header-menu-email">{sessionUser ? email : "Guest"}</span>
              </div>
              {sessionUser ? (
                <>
                  <button
                    type="button"
                    className="drive-header-menu-item"
                    role="menuitem"
                    onClick={handleOpenModal}
                  >
                    Account Settings
                  </button>
                  <a
                    href="/api/auth/signout"
                    className="drive-header-menu-item"
                    role="menuitem"
                    onClick={handleCloseMenu}
                  >
                    Sign out
                  </a>
                </>
              ) : (
                <a
                  href="/login"
                  className="drive-header-menu-item"
                  role="menuitem"
                  onClick={handleCloseMenu}
                >
                  Sign in
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      {sessionUser && (
        <AccountSettingsModal
          open={modalOpen}
          onClose={handleCloseModal}
          userEmail={email}
        />
      )}
    </>
  );
}
