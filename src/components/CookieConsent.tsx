"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "storgbay_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="cookie-consent-banner"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="cookie-consent-banner__content">
        <p>
          We use essential cookies for authentication and security. No tracking or analytics cookies are used.{" "}
          <a href="/privacy" className="cookie-consent-banner__link">Learn more</a>
        </p>
        <button
          onClick={accept}
          className="cookie-consent-banner__button"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
