export const dynamic = "force-dynamic";

import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { HeaderSearch } from "@/components/HeaderSearch";
import { DriveSidebar } from "@/components/DriveSidebar";
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
  const showSidebar = Boolean(session?.user);

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
            {session?.user && <HeaderSearch />}
          </div>
          <div className="drive-header-actions">
            <div className="drive-header-pills" role="list">
              <span role="listitem" className="drive-pill muted">
                {session?.user?.email ?? "Guest"}
              </span>
              {session?.user ? (
                <a role="listitem" className="drive-pill" href="/api/auth/signout">
                  Sign out
                </a>
              ) : (
                <a role="listitem" className="drive-pill" href="/api/auth/signin">
                  Sign in
                </a>
              )}
            </div>
          </div>
        </header>
        <div className="drive-content">
          {showSidebar && <DriveSidebar navItems={navItems} sessionUser={session?.user ?? null} />}
          <main className={clsx("drive-main", { "drive-main--expanded": !showSidebar })}>{children}</main>
        </div>
      </body>
    </html>
  );
}
