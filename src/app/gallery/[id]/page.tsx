export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { GalleryViewer } from "@/components/GalleryViewer";
import { GalleryManagersPanel } from "@/components/GalleryManagersPanel";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageGallery, canViewGallery } from "@/lib/gallery-permissions";
import { publicUrl, presignGet } from "@/lib/s3";

type PageProps = { params: Promise<{ id: string }> };
const INITIAL_PAGE_SIZE = 24;

type FileWithUrl = {
  id: string;
  filename: string;
  mime: string | null;
  bytes: number;
  createdAt: Date;
  _url: string | null;
};

export default async function GalleryPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const g = await prisma.gallery.findUnique({
    where: { id },
    include: {
      managers: { include: { user: true } },
      owner: true,
    },
  });
  if (!g) notFound();
  if (!canViewGallery(g, session)) notFound();

  const initialItems = await prisma.galleryItem.findMany({
    where: { galleryId: g.id },
    include: { file: true },
    orderBy: [{ position: "asc" }, { file: { createdAt: "desc" } }],
    take: INITIAL_PAGE_SIZE + 1,
  });

  const hasMoreInitialItems = initialItems.length > INITIAL_PAGE_SIZE;
  const itemsToRender = hasMoreInitialItems ? initialItems.slice(0, INITIAL_PAGE_SIZE) : initialItems;
  const initialCursor = hasMoreInitialItems ? itemsToRender[itemsToRender.length - 1]?.id ?? null : null;

  const filesWithUrl: FileWithUrl[] = await Promise.all(
    itemsToRender.map(async (item) => {
      const file = item.file;

      try {
        const url =
          g.visibility === "PUBLIC" ? publicUrl(file.key) : await presignGet(file.key);

        return { ...file, _url: url ?? null };
      } catch (error) {
        console.error("Failed to resolve file URL", { key: file.key, error });
        return { ...file, _url: null };
      }
    })
  );

  const galleryInfo = {
    id: g.id,
    title: g.title,
    description: g.description,
    visibility: g.visibility,
  } as const;

  const serialisableFiles = filesWithUrl.map((file) => ({
    ...file,
    createdAt: file.createdAt.toISOString(),
  }));
  const totalFileCount = await prisma.galleryItem.count({ where: { galleryId: g.id } });

  const canManage = canManageGallery(g, session);

  const initialManagers = g.managers
    .filter((manager) => manager.userId !== g.ownerId)
    .map((manager) => ({
      id: manager.id,
      userId: manager.userId,
      name: manager.user?.name ?? null,
      email: manager.user?.email ?? null,
      addedAt: manager.createdAt.toISOString(),
    }))
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt));

  const canEditManagers = session?.user?.id === g.ownerId || session?.user?.role === "ADMIN";

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <GalleryViewer
        gallery={galleryInfo}
        galleryId={g.id}
        files={serialisableFiles}
        hasMoreInitialItems={hasMoreInitialItems}
        initialCursor={initialCursor}
        totalFileCount={totalFileCount}
      />
      {canManage && (
        <GalleryManagersPanel
          galleryId={g.id}
          canEdit={canEditManagers}
          initialManagers={initialManagers}
          ownerLabel={g.owner?.name ?? g.owner?.email ?? "Gallery owner"}
        />
      )}
    </div>
  );
}
