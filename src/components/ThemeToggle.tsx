"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "storgbay-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [hasUserPreference, setHasUserPreference] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      setHasUserPreference(true);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.setAttribute("data-theme", theme);

    if (typeof window !== "undefined") {
      if (hasUserPreference) {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      } else {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      }
    }
  }, [theme, hasUserPreference]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (!hasUserPreference) {
        setTheme(event.matches ? "dark" : "light");
      }
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [hasUserPreference]);

  const toggleTheme = () => {
    setHasUserPreference(true);
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const icon = theme === "dark" ? "🌙" : "☀️";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      data-state={theme}
    >
      <span className="theme-toggle-icon" aria-hidden>
        {icon}
      </span>
      <span className="theme-toggle-label">{theme === "dark" ? "Dark" : "Light"} mode</span>
    </button>
  );
}

