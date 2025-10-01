"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppSessionUser } from "@/lib/auth";

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
  const shouldHideSidebar = !sessionUser && isGalleryRoute;

  if (shouldHideSidebar) {
    return null;
  }

  return (
    <aside className="drive-sidebar" aria-label="Primary navigation">
      <nav className="drive-nav">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="drive-nav-link">
            {item.label}
          </Link>
        ))}
      </nav>
      {sessionUser && (
        <div className="drive-sidebar-footer">
          <p className="drive-sidebar-caption">Organize and share with ease.</p>
          <Link href="/upload" className="drive-cta">
            New upload
          </Link>
        </div>
      )}
    </aside>
  );
}
