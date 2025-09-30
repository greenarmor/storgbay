type GalleryVisibility = "PUBLIC" | "PRIVATE";

type GalleryManager = {
  userId: string;
};

type GalleryLike = {
  ownerId: string;
  visibility: GalleryVisibility;
  managers?: GalleryManager[];
};

type GalleryOwnerOnly = {
  ownerId: string;
  managers?: GalleryManager[];
};

export type SessionLike = {
  user?: {
    id?: string | null;
    role?: string | null;
  } | null;
} | null;

export function canViewGallery(gallery: GalleryLike, session: SessionLike) {
  if (gallery.visibility === "PUBLIC") return true;
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) return false;
  if (sessionUserId === gallery.ownerId) return true;
  return gallery.managers?.some((manager) => manager.userId === sessionUserId) ?? false;
}

export function canManageGallery(gallery: GalleryOwnerOnly, session: SessionLike) {
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) return false;
  if (sessionUserId === gallery.ownerId) return true;
  const isAdmin = session?.user?.role === "ADMIN";
  if (isAdmin) return true;
  return gallery.managers?.some((manager) => manager.userId === sessionUserId) ?? false;
}
