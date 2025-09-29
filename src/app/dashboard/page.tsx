export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Dashboard(){
  const session = await auth();
  if(!session) return <div>Please sign in.</div>;
  const myGalleries = await prisma.gallery.findMany({ where: { ownerId: session.user.id }, orderBy: { createdAt: 'desc' } });
  type GalleryRecord = (typeof myGalleries)[number];
  return (
    <div>
      <h2>My Galleries</h2>
      {/* Simple create form */}
      <form action="/api/galleries" method="post" onSubmit={async (e:any)=>{
        e.preventDefault();
        await fetch('/api/galleries',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({title:(e.currentTarget.title?.value||'New Gallery'),visibility:e.currentTarget.visibility?.value||'PUBLIC',fileIds:[]})
        });
        location.reload();
      }}>
        <input name="title" placeholder="Gallery title" />
        <select name="visibility" defaultValue="PUBLIC">
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
        <button type="submit">+ Create</button>
      </form>
      <ul>
        {myGalleries.map((g: GalleryRecord) => (
          <li key={g.id}><Link href={`/gallery/${g.id}`}>{g.title}</Link> – {g.visibility}</li>
        ))}
      </ul>
    </div>
  );
}
