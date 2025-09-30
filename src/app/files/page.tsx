export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileManager } from "@/components/FileManager";
import { auth } from "@/lib/auth";

export default async function FilesPage() {
  const session = await auth();
  if (!session) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h1>My files</h1>
        <p>You need to sign in to view your library.</p>
        <Link href="/api/auth/signin" style={{ color: "#1a73e8" }}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>My file library</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Organise your uploads, build galleries, and preview any media in one place.
        </p>
      </div>
      <FileManager />
    </div>
  );
}
