export const dynamic = "force-dynamic";

import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { HeaderSearch } from "@/components/HeaderSearch";
import { DriveSidebar } from "@/components/DriveSidebar";
import { auth, AppSession } from "@/lib/auth";
import { HeaderActions } from "@/components/HeaderActions";

const publicNav = [{ href: "/", label: "Home" }];
const authenticatedNav = [
  ...publicNav,
  { href: "/dashboard", label: "My Drive" },
  { href: "/documents", label: "Document viewer" },
];

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = (await auth()) as AppSession | null;
  const baseNav = session?.user ? authenticatedNav : publicNav;
  const navItems = baseNav;
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
          <HeaderActions sessionUser={session?.user ?? null} />
        </header>
        <div className="drive-content">
          {showSidebar && (
            <DriveSidebar
              navItems={navItems}
              sessionUser={session?.user ?? null}
            />
          )}
          <main
            className={clsx("drive-main", {
              "drive-main--expanded": !showSidebar,
            })}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
