"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileManager } from "@/components/FileManager";

type GalleryManagerModalProps = {
  open: boolean;
  onClose: () => void;
};

export function GalleryManagerModal({ open, onClose }: GalleryManagerModalProps) {
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
    <div className="gallery-manager-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gallery-manager-window"
        role="dialog"
        aria-modal="true"
        aria-label="File Manager"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gallery-manager-header">
          <div>
            <h2>My files</h2>
            <p>Organize your files and build new galleries without leaving your current view.</p>
          </div>
          <button type="button" className="gallery-manager-close" onClick={onClose} aria-label="Close Gallery Manager">
            ×
          </button>
        </header>
        <div className="gallery-manager-content">
          <FileManager />
        </div>
      </div>
    </div>,
    document.body
  );
}
