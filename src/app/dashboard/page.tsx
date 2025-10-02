export const dynamic = "force-dynamic";

import Link from "next/link";
import { CreateGalleryForm } from "@/components/CreateGalleryForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Dashboard() {
  const session = await auth();
  if (!session) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h2>Dashboard</h2>
        <p>You need to sign in to access your dashboard.</p>
        <Link href="/login" style={{ color: "var(--drive-accent)" }}>
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
          <h2 style={{ marginBottom: 4 }}>Folders</h2>
          <p style={{ margin: 0, color: "var(--drive-muted)" }}>
            Create curated collections, control their visibility, and collaborate with other uploaders.
          </p>
        </div>
        <div className="drive-panel">
          <div className="drive-panel-header">
            <h3 style={{ margin: 0 }}>Create a new folder</h3>
            <p className="drive-panel-description">
              Name your folder and choose whether it should be visible to the whole workspace or remain private.
            </p>
          </div>
          <CreateGalleryForm />
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
          {myGalleries.length === 0 ? (
            <li
              style={{
                padding: 16,
                border: "1px solid var(--drive-border)",
                borderRadius: "var(--drive-radius-md)",
                background: "var(--drive-surface)",
              }}
            >
              <p style={{ margin: 0 }}>You haven&apos;t created any galleries yet.</p>
            </li>
          ) : (
            myGalleries.map((g: GalleryRecord) => {
              const isOwner = g.ownerId === session.user.id;
              const ownerLabel = g.owner?.name ?? g.owner?.email ?? "Unknown owner";
              return (
                <li
                  key={g.id}
                  style={{
                    padding: 16,
                    border: "1px solid var(--drive-border)",
                    borderRadius: "var(--drive-radius-md)",
                    background: "var(--drive-surface)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                      <Link href={`/gallery/${g.id}`} style={{ fontWeight: 600 }}>
                        {g.title}
                      </Link>
                      <div style={{ fontSize: 12, color: "var(--drive-muted)" }}>Visibility: {g.visibility}</div>
                      {!isOwner && <div style={{ fontSize: 12, color: "var(--drive-muted)" }}>Owner: {ownerLabel}</div>}
                    </div>
                    <Link href={`/gallery/${g.id}`} style={{ color: "var(--drive-accent)" }}>
                      View
                    </Link>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
