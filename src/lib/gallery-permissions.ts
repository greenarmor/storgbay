import type { Gallery } from "@prisma/client";

export type SessionLike = {
  user?: {
    id?: string | null;
  } | null;
} | null;

export function canViewGallery(gallery: Pick<Gallery, "ownerId" | "visibility">, session: SessionLike) {
  if (gallery.visibility === "PUBLIC") return true;
  const sessionUserId = session?.user?.id;
  return !!sessionUserId && sessionUserId === gallery.ownerId;
}

export function isGalleryOwner(gallery: Pick<Gallery, "ownerId">, session: SessionLike) {
  const sessionUserId = session?.user?.id;
  return !!sessionUserId && sessionUserId === gallery.ownerId;
}
