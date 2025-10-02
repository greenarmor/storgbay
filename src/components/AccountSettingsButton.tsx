"use client";

import { useCallback, useState } from "react";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";

type AccountSettingsButtonProps = {
  email: string;
};

export function AccountSettingsButton({ email }: AccountSettingsButtonProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        role="listitem"
        className="drive-pill-button"
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="account-settings-modal"
      >
        {email}
      </button>
      <AccountSettingsModal open={open} onClose={handleClose} userEmail={email} />
    </>
  );
}
