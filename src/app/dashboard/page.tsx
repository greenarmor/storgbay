export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileManager } from "@/components/FileManager";
import { CreateGalleryForm } from "@/components/CreateGalleryForm";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Dashboard() {
  const session = await auth();
  if (!session) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h2>Dashboard</h2>
        <p>You need to sign in to access your dashboard.</p>
        <Link href="/api/auth/signin" style={{ color: "#1a73e8" }}>
          Go to sign in
        </Link>
      </div>
    );
  }

  const myGalleries = await prisma.gallery.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { managers: { some: { userId: session.user.id } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });

  type GalleryRecord = (typeof myGalleries)[number];

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <section style={{ display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Galleries I manage</h2>
          <p style={{ margin: 0, color: "#555" }}>
            Create curated collections, control their visibility, and collaborate with other uploaders.
          </p>
        </div>
        <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 12, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Create a new gallery</h3>
          <CreateGalleryForm />
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
          {myGalleries.length === 0 ? (
            <li style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
              <p style={{ margin: 0 }}>You haven&apos;t created any galleries yet.</p>
            </li>
          ) : (
            myGalleries.map((g: GalleryRecord) => {
              const isOwner = g.ownerId === session.user.id;
              const ownerLabel = g.owner?.name ?? g.owner?.email ?? "Unknown owner";
              return (
                <li key={g.id} style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                      <Link href={`/gallery/${g.id}`} style={{ fontWeight: 600 }}>
                        {g.title}
                      </Link>
                      <div style={{ fontSize: 12, color: "#666" }}>Visibility: {g.visibility}</div>
                      {!isOwner && (
                        <div style={{ fontSize: 12, color: "#666" }}>Owner: {ownerLabel}</div>
                      )}
                    </div>
                    <Link href={`/gallery/${g.id}`} style={{ color: "#1a73e8" }}>
                      View
                    </Link>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>My files</h2>
          <p style={{ margin: 0, color: "#555" }}>
            Browse your uploads, create new galleries, and add items to existing collections without leaving the dashboard.
          </p>
        </div>
        <FileManager />
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Account security</h2>
          <p style={{ margin: 0, color: "#555" }}>
            Change your password. You can only update your own account details from here.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
