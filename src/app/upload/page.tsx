import Link from "next/link";
import { UploadClient } from "./UploadClient";
import { auth } from "@/lib/auth";

export default async function UploadPage() {
  const session = await auth();

  if (!session) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Upload files</h1>
        <p style={{ margin: 0 }}>You need to sign in to access the upload manager.</p>
        <Link href="/api/auth/signin" style={{ color: "#1a73e8" }}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return <UploadClient />;
}
