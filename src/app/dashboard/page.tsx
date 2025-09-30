export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateGalleryForm } from "@/components/CreateGalleryForm";

export default async function Dashboard(){
  const session = await auth();
  if(!session) return <div>Please sign in.</div>;
  const myGalleries = await prisma.gallery.findMany({ where: { ownerId: session.user.id }, orderBy: { createdAt: 'desc' } });
  type GalleryRecord = (typeof myGalleries)[number];
  return (
    <div>
      <h2>My Galleries</h2>
      {/* Simple create form */}
      <CreateGalleryForm />
      <ul>
        {myGalleries.map((g: GalleryRecord) => (
          <li key={g.id}><Link href={`/gallery/${g.id}`}>{g.title}</Link> – {g.visibility}</li>
        ))}
      </ul>
    </div>
  );
}
