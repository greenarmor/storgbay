"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { AppSessionUser } from "@/lib/auth";
import { GalleryManagerModal } from "./GalleryManagerModal";

type NavItem = {
  href: string;
  label: string;
};

type DriveSidebarProps = {
  navItems: NavItem[];
  sessionUser: AppSessionUser | null;
};

export function DriveSidebar({ navItems, sessionUser }: DriveSidebarProps) {
  const pathname = usePathname();
  const isGalleryRoute = pathname?.startsWith("/gallery");
  const isHomeRoute = pathname === "/";
  const shouldHideSidebar = !sessionUser && isGalleryRoute;
  const shouldShowCta = Boolean(sessionUser) || isHomeRoute;
  const [isGalleryManagerOpen, setGalleryManagerOpen] = useState(false);

  if (shouldHideSidebar) {
    return null;
  }

  return (
    <>
      <aside className="drive-sidebar" aria-label="Primary navigation">
        <nav className="drive-nav">
          {navItems.map((item) => {
            const isMyDrive = item.href === "/dashboard";
            return (
              <div key={item.href} className={isMyDrive ? "drive-nav-group" : undefined}>
                <Link href={item.href} className="drive-nav-link">
                  {item.label}
                </Link>
                {isMyDrive && (
                  <div className="drive-nav-sublinks">
                    <button
                      type="button"
                      className="drive-nav-sublink"
                      onClick={() => setGalleryManagerOpen(true)}
                      aria-haspopup="dialog"
                      aria-expanded={isGalleryManagerOpen}
                    >
                      My files
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        {shouldShowCta && (
          <div className="drive-sidebar-footer">
            <p className="drive-sidebar-caption">Organize and share with ease.</p>
            <Link href="/upload" className="drive-cta">
              New upload
            </Link>
          </div>
        )}
      </aside>
      <GalleryManagerModal open={isGalleryManagerOpen} onClose={() => setGalleryManagerOpen(false)} />
    </>
  );
}
