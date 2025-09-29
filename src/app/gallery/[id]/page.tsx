import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewGallery } from "@/lib/gallery-permissions";
import { publicUrl, presignGet } from "@/lib/s3";
import Image from "next/image";
import { notFound } from "next/navigation";

function isImage(m: string){ return m?.startsWith("image/"); }
function isVideo(m: string){ return m?.startsWith("video/"); }
function isAudio(m: string){ return m?.startsWith("audio/"); }
function isPdf(m: string){ return m === "application/pdf"; }

export default async function GalleryPage({ params }: { params: { id: string } }){
  const session = await auth();
  const g = await prisma.gallery.findUnique({ where: { id: params.id }, include: { items: { include: { file: true } } } });
  if(!g) notFound();
  if(!canViewGallery(g, session)) notFound();

  const filesWithUrl = await Promise.all(g.items.map(async it => {
    const f = it.file;
    const url = g.visibility === 'PUBLIC' ? publicUrl(f.key) : await presignGet(f.key);
    return { ...f, _url: url };
  }));

  return (
    <div>
      <h2>{g.title} {g.visibility === 'PRIVATE' && <small style={{marginLeft:8,padding:'2px 6px',border:'1px solid #ddd',borderRadius:6}}>Private</small>}</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
        {filesWithUrl.map(f => (
          <div key={f.id} style={{border:'1px solid #eee',borderRadius:8,padding:8}}>
            {isImage(f.mime) && <Image src={f._url} alt={f.filename} width={800} height={600} style={{width:'100%',height:'auto'}} />}
            {isVideo(f.mime) && <video src={f._url} controls style={{width:'100%'}} />}
            {isAudio(f.mime) && <audio src={f._url} controls style={{width:'100%'}} />}
            {isPdf(f.mime) && <iframe src={f._url} style={{width:'100%',height:360,border:'none'}} />}
            {!isImage(f.mime) && !isVideo(f.mime) && !isAudio(f.mime) && !isPdf(f.mime) && (
              <div style={{display:'grid',placeItems:'center',height:160,background:'#fafafa',border:'1px dashed #ddd',borderRadius:8}}>
                <span>{f.mime || 'file'}</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
              <span title={f.filename} style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>{f.filename}</span>
              <a href={f._url} download>Download</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
