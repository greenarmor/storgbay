"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "storgbay_cookie_consent";
const CONSENT_VERSION = "1.0.0";

type ConsentState = {
  accepted: boolean;
  version: string;
  timestamp: string;
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) {
        setVisible(true);
        return;
      }
      const consent: ConsentState = JSON.parse(raw);
      if (!consent.accepted || consent.version !== CONSENT_VERSION) {
        setVisible(true);
      } else {
        setShowWithdraw(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    const consent: ConsentState = {
      accepted: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
    setShowWithdraw(true);

    fetch("/api/account/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cookie_essential", version: CONSENT_VERSION }),
    }).catch(() => {});
  }

  function reject() {
    const consent: ConsentState = {
      accepted: false,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
  }

  function withdraw() {
    localStorage.removeItem(CONSENT_KEY);
    setShowWithdraw(false);
    setVisible(true);
  }

  if (visible) {
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
          <div className="cookie-consent-banner__actions">
            <button
              onClick={reject}
              className="cookie-consent-banner__button"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="cookie-consent-banner__button cookie-consent-banner__button--accept"
            >
              Accept essential cookies
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showWithdraw) {
    return (
      <div
        className="cookie-consent-banner"
        role="complementary"
        aria-label="Cookie settings"
        style={{ position: "relative", boxShadow: "none", border: "1px solid var(--drive-border)", borderRadius: 8, marginBottom: "1rem" }}
      >
        <div className="cookie-consent-banner__content">
          <p>
            Essential cookies are active.{" "}
            <a href="/privacy" className="cookie-consent-banner__link">Privacy policy</a>
          </p>
          <button
            onClick={withdraw}
            className="cookie-consent-banner__button"
          >
            Withdraw consent
          </button>
        </div>
      </div>
    );
  }

  return null;
}
