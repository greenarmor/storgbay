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
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__intro">
          <span className="dashboard-hero__eyebrow">Welcome back</span>
          <h1 className="dashboard-hero__title">Hi {userLabel}, here&apos;s your creative hub</h1>
          <p className="dashboard-hero__subtitle">
            Track folders you own, collaborate on shared galleries, and jump straight into organising your media.
          </p>
        </div>
          <div className="dashboard-hero__actions">
            <div className="dashboard-hero__stat">
              <strong>{ownedCount}</strong>
              <span>Folders you own</span>
            </div>
            <div className="dashboard-hero__stat">
              <strong>{managedCount}</strong>
              <span>Shared with you</span>
            </div>
            <Link href="/upload" className="drive-button-primary dashboard-hero__cta">
              Upload new files
            </Link>
            <Link href="/documents" className="drive-button-muted dashboard-hero__cta">
              Open document studio
            </Link>
          </div>
      </header>

      <div className="dashboard-sections">
        <section className="dashboard-section">
          <div className="drive-panel" id="create-folder-panel">
            <div className="drive-panel-header">
              <h2 className="dashboard-section__title">Create a new folder</h2>
              <p className="drive-panel-description">
                Name your folder and choose whether it should be visible to the whole workspace or remain private.
              </p>
            </div>
            <CreateGalleryForm />
          </div>

          <div className="drive-panel">
            <div className="drive-panel-header">
              <div>
                <h3 className="dashboard-section__subtitle">Your folders</h3>
                <p className="drive-panel-description">
                  Review everything you&apos;re collaborating on and jump straight to a gallery.
                </p>
              </div>
            </div>
            <ul className="dashboard-gallery-list">
              {myGalleries.length === 0 ? (
                <li className="dashboard-gallery-empty">
                  <p>You haven&apos;t created or joined any folders yet.</p>
                  <a href="#create-folder-panel" className="drive-button-primary">
                    Create your first folder
                  </a>
                </li>
              ) : (
                myGalleries.map((g: GalleryRecord) => {
                  const isOwner = g.ownerId === session.user.id;
                  const ownerLabel = g.owner?.name ?? g.owner?.email ?? "Unknown owner";
                  return (
                    <li key={g.id} className="dashboard-gallery-card">
                      <div className="dashboard-gallery-card__content">
                        <Link href={`/gallery/${g.id}`} className="dashboard-gallery-card__title">
                          {g.title}
                        </Link>
                        <div className="dashboard-gallery-card__meta">
                          <span>Visibility: {g.visibility}</span>
                          {!isOwner && <span>Owner: {ownerLabel}</span>}
                        </div>
                      </div>
                      <Link href={`/gallery/${g.id}`} className="drive-button-muted dashboard-gallery-card__cta">
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
