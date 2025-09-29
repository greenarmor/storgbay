type GalleryVisibility = "PUBLIC" | "PRIVATE";

type GalleryLike = {
  ownerId: string;
  visibility: GalleryVisibility;
};

type GalleryOwnerOnly = {
  ownerId: string;
};

export type SessionLike = {
  user?: {
    id?: string | null;
  } | null;
} | null;

export function canViewGallery(gallery: GalleryLike, session: SessionLike) {
  if (gallery.visibility === "PUBLIC") return true;
  const sessionUserId = session?.user?.id;
  return !!sessionUserId && sessionUserId === gallery.ownerId;
}

export function isGalleryOwner(gallery: GalleryOwnerOnly, session: SessionLike) {
  const sessionUserId = session?.user?.id;
  return !!sessionUserId && sessionUserId === gallery.ownerId;
}
