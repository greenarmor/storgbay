export const dynamic = "force-dynamic";

import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { auth, AppSession } from "@/lib/auth";

const publicNav = [{ href: "/", label: "Public" }];
const authenticatedNav = [
  ...publicNav,
  { href: "/dashboard", label: "My Drive" },
  { href: "/upload", label: "Upload" },
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = (await auth()) as AppSession | null;
  const baseNav = session?.user ? authenticatedNav : publicNav;
  const navItems =
    session?.user?.role === "ADMIN" ? [...baseNav, { href: "/admin", label: "Admin Console" }] : baseNav;

  return (
    <html lang="en">
      <body className="app-shell">
        <header className="drive-header">
          <div className="drive-header-left">
            <Link href="/" className="drive-logo" aria-label="Storgbay home">
              <span className="drive-logo-mark" aria-hidden>
                ☁️
              </span>
              <span className="drive-logo-text">Storgbay</span>
            </Link>
            <label className="drive-search" htmlFor="drive-search">
              <span className="drive-search-icon" aria-hidden>
                🔍
              </span>
              <input
                id="drive-search"
                className="drive-search-input"
                type="search"
                name="search"
                placeholder="Search files, folders, galleries..."
                autoComplete="off"
              />
            </label>
          </div>
          <div className="drive-header-actions">
            <div className="drive-header-pills" role="list">
              <span role="listitem" className="drive-pill muted">
                {session?.user?.email ?? "Guest"}
              </span>
              {session?.user && (
                <a role="listitem" className="drive-pill" href="/api/auth/signout">
                  Sign out
                </a>
              )}
            </div>
          </div>
        </header>
        <div className="drive-content">
          <aside className="drive-sidebar" aria-label="Primary navigation">
            <nav className="drive-nav">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="drive-nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
            {session?.user && (
              <div className="drive-sidebar-footer">
                <p className="drive-sidebar-caption">Organize and share with ease.</p>
                <Link href="/upload" className="drive-cta">
                  New upload
                </Link>
              </div>
            )}
          </aside>
          <main className="drive-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
