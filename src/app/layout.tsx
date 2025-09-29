import "./globals.css";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en"><body>
      <nav style={{display:'flex',gap:12,padding:12,borderBottom:'1px solid #eee'}}>
        <Link href="/">Public</Link>
        <Link href="/dashboard">My Dashboard</Link>
        <Link href="/upload">Upload</Link>
        {(session as any)?.user?.role === 'ADMIN' && <Link href="/admin">Admin</Link>}
        {session?.user ? (
          <a href="/api/auth/signout">Sign out</a>
        ) : (
          <a href="/api/auth/signin">Sign in</a>
        )}
      </nav>
      <main style={{padding:24}}>{children}</main>
    </body></html>
  );
}
