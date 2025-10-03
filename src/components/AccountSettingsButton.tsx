"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";

type AccountSettingsButtonProps = {
  email: string;
};

export function AccountSettingsButton({
  email,
}: AccountSettingsButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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
    function handleDocumentClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
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
  }, []);

  return (
    <>
      <div className="drive-pill-dropdown" role="listitem" ref={dropdownRef}>
        <button
          type="button"
          className="drive-pill-button drive-pill-button--dropdown"
          onClick={handleToggleMenu}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="drive-pill-button-label">{email}</span>
          <span className="drive-pill-button-icon" aria-hidden>
            ▾
          </span>
        </button>
        {menuOpen && (
          <div className="drive-pill-menu" role="menu">
            <Link
              href="/dashboard"
              className="drive-pill-menu-item"
              role="menuitem"
              onClick={handleCloseMenu}
            >
              My Drive
            </Link>
            <button
              type="button"
              className="drive-pill-menu-item"
              role="menuitem"
              onClick={handleOpenModal}
            >
              Account Settings
            </button>
          </div>
        )}
      </div>
      <AccountSettingsModal
        open={modalOpen}
        onClose={handleCloseModal}
        userEmail={email}
      />
    </>
  );
}
