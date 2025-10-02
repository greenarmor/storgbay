export const dynamic = "force-dynamic";

import Link from "next/link";
import { DashboardFileExplorer } from "@/components/DashboardFileExplorer";
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

  const ownedCount = myGalleries.filter((g) => g.ownerId === session.user.id).length;
  const managedCount = myGalleries.length - ownedCount;
  const userLabel = session.user.name ?? session.user.email ?? "there";

  type GalleryRecord = (typeof myGalleries)[number];

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 24,
          border: "1px solid var(--drive-border)",
          borderRadius: "var(--drive-radius-md)",
          background: "var(--drive-surface)",
          boxShadow: "0 2px 6px rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--drive-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Welcome back
          </span>
          <h1 style={{ margin: 0 }}>Hi {userLabel}, here&apos;s your creative hub</h1>
          <p style={{ margin: 0, color: "var(--drive-muted)" }}>
            Track folders you own, collaborate on shared galleries, and jump straight into organising your media.
          </p>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div
            style={{
              display: "grid",
              gap: 4,
              padding: 16,
              minWidth: 160,
              borderRadius: "var(--drive-radius-sm)",
              background: "var(--drive-muted-surface)",
              border: "1px solid var(--drive-border)",
            }}
          >
            <strong style={{ fontSize: 24 }}>{ownedCount}</strong>
            <span style={{ fontSize: 13, color: "var(--drive-muted)" }}>Folders you own</span>
          </div>
          <div
            style={{
              display: "grid",
              gap: 4,
              padding: 16,
              minWidth: 160,
              borderRadius: "var(--drive-radius-sm)",
              background: "var(--drive-muted-surface)",
              border: "1px solid var(--drive-border)",
            }}
          >
            <strong style={{ fontSize: 24 }}>{managedCount}</strong>
            <span style={{ fontSize: 13, color: "var(--drive-muted)" }}>Shared with you</span>
          </div>
          <Link
            href="/upload"
            className="drive-button-primary"
            style={{ alignSelf: "center" }}
          >
            Upload new files
          </Link>
        </div>
      </header>

      <div style={{ display: "grid", gap: 24 }}>
        <section style={{ display: "grid", gap: 16 }}>
          <div className="drive-panel" id="create-folder-panel">
            <div className="drive-panel-header">
              <h2 style={{ margin: 0 }}>Create a new folder</h2>
              <p className="drive-panel-description">
                Name your folder and choose whether it should be visible to the whole workspace or remain private.
              </p>
            </div>
            <CreateGalleryForm />
          </div>

          <div className="drive-panel">
            <div className="drive-panel-header">
              <div>
                <h3 style={{ margin: 0 }}>Your folders</h3>
                <p className="drive-panel-description">
                  Review everything you&apos;re collaborating on and jump straight to a gallery.
                </p>
              </div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
              {myGalleries.length === 0 ? (
                <li
                  style={{
                    padding: 20,
                    border: "1px dashed var(--drive-border)",
                    borderRadius: "var(--drive-radius-md)",
                    background: "var(--drive-muted-surface)",
                    textAlign: "center",
                  }}
                >
                  <p style={{ marginBottom: 12 }}>You haven&apos;t created or joined any folders yet.</p>
                  <a href="#create-folder-panel" className="drive-button-primary">
                    Create your first folder
                  </a>
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
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <Link href={`/gallery/${g.id}`} style={{ fontWeight: 600, fontSize: 16 }}>
                          {g.title}
                        </Link>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--drive-muted)" }}>
                          <span>Visibility: {g.visibility}</span>
                          {!isOwner && <span>Owner: {ownerLabel}</span>}
                        </div>
                      </div>
                      <Link href={`/gallery/${g.id}`} className="drive-button-muted">
                        Open folder
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </section>

        <DashboardFileExplorer />
      </div>
    </div>
  );
}
