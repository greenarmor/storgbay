export const dynamic = "force-dynamic";

import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { HeaderSearch } from "@/components/HeaderSearch";
import { DriveSidebar } from "@/components/DriveSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { auth, AppSession } from "@/lib/auth";
import { AccountSettingsButton } from "@/components/AccountSettingsButton";

const publicNav = [{ href: "/", label: "Home" }];
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
            <ThemeToggle />
            <div className="drive-header-pills" role="list">
              {session?.user ? (
                <AccountSettingsButton
                  email={session.user.email ?? session.user.name ?? "Account"}
                />
              ) : (
                <span role="listitem" className="drive-pill muted">
                  Guest
                </span>
              )}
              {session?.user ? (
                <a role="listitem" className="drive-pill" href="/api/auth/signout">
                  Sign out
                </a>
              ) : (
                <a role="listitem" className="drive-pill" href="/login">
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
