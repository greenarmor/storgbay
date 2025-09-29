export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { publicUrl } from "@/lib/s3";

function isImage(m?: string){ return !!m && m.startsWith("image/"); }

export default async function Home() {
  const galleries = await prisma.gallery.findMany({
    where: { visibility: "PUBLIC" },
    include: { items: { include: { file: true } } },
    orderBy: { createdAt: "desc" }
  });
  type GalleryRecord = (typeof galleries)[number];
  type GalleryItemRecord = GalleryRecord["items"][number];
  return (
    <div style={{display:'grid',gap:16}}>
      {galleries.map((g: GalleryRecord) => (
        <Link key={g.id} href={`/gallery/${g.id}`}>
          <div style={{border:'1px solid #eee',padding:12,borderRadius:8}}>
            <h3>{g.title}</h3>
            <div style={{display:'flex',gap:8,overflowX:'auto'}}>
              {g.items.slice(0,4).map((it: GalleryItemRecord) => (
                isImage(it.file.mime)
                  ? <Image key={it.id} src={publicUrl(it.file.key)} alt={it.file.filename} width={160} height={120} />
                  : <div key={it.id} style={{width:160,height:120,display:'grid',placeItems:'center',background:'#fafafa',border:'1px dashed #ddd',borderRadius:8}}>
                      <small>{it.file.mime}</small>
                    </div>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
