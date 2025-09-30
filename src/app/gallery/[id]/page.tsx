export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { GalleryViewer } from "@/components/GalleryViewer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewGallery } from "@/lib/gallery-permissions";
import { publicUrl, presignGet } from "@/lib/s3";

type PageProps = { params: Promise<{ id: string }> };

type FileWithUrl = {
  id: string;
  filename: string;
  mime: string | null;
  bytes: number;
  createdAt: Date;
  _url: string;
};

export default async function GalleryPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const g = await prisma.gallery.findUnique({
    where: { id },
    include: { items: { include: { file: true } } },
  });
  if (!g) notFound();
  if (!canViewGallery(g, session)) notFound();

  const filesWithUrl: FileWithUrl[] = await Promise.all(
    g.items.map(async (item) => {
      const file = item.file;
      const url = g.visibility === "PUBLIC" ? publicUrl(file.key) : await presignGet(file.key);
      return { ...file, _url: url };
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

  return <GalleryViewer gallery={galleryInfo} files={serialisableFiles} />;
}
