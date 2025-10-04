import DocumentsClient from "./DocumentsClient";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDocumentFile } from "@/lib/file-utils";
import { presignGet } from "@/lib/s3";

type PageProps = {
  searchParams?: Promise<{ file?: string }>;
};

export default async function DocumentsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const fileId = params.file?.trim();

  let initialDocument: { id: string; filename: string; url: string } | null = null;
  let initialStatus: { tone: "info" | "success" | "warning" | "error"; text: string } | null = null;

  if (fileId) {
    const session = await auth();

    if (!session?.user?.id) {
      initialStatus = {
        tone: "warning",
        text: "Sign in to load saved documents from your storage.",
      };
    } else {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
          galleryItems: {
            include: {
              gallery: {
                include: { managers: true },
              },
            },
          },
        },
      });

      if (!file || !isDocumentFile(file.mime, file.filename)) {
        initialStatus = {
          tone: "error",
          text: "We couldn't find a compatible document to view.",
        };
      } else {
        const userId = session.user.id;
        const isOwner = file.ownerId === userId;
        const canViewViaGallery = file.galleryItems.some((item) => {
          const gallery = item.gallery;
          if (!gallery) return false;
          if (gallery.visibility === "PUBLIC") return true;
          if (gallery.ownerId === userId) return true;
          return gallery.managers.some((manager) => manager.userId === userId);
        });

        if (!isOwner && !canViewViaGallery) {
          initialStatus = {
            tone: "error",
            text: "You don't have access to that stored document.",
          };
        } else {
          try {
            const url = await presignGet(file.key);
            initialDocument = { id: file.id, filename: file.filename, url };
          } catch (error) {
            console.error("Failed to prepare document for viewing", error);
            initialStatus = {
              tone: "error",
              text: "We couldn't prepare the document for viewing. Please try again shortly.",
            };
          }
        }
      }
    }
  }

  return <DocumentsClient initialDocument={initialDocument} initialStatus={initialStatus} />;
}
