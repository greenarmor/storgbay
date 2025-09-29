'use client';
import { useState } from 'react';

export default function UploadPage(){
  const [files,setFiles] = useState<FileList|null>(null);
  const [status,setStatus] = useState<string>('');

  async function onUpload(){
    if(!files || files.length===0) return;
    for (const file of Array.from(files)){
      const r = await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name,mime:file.type||'application/octet-stream'})});
      const { url } = await r.json();
      setStatus(`Uploading ${file.name}...`);
      await fetch(url,{method:'PUT',body:file,headers:{'Content-Type':file.type||'application/octet-stream'}});
    }
    setStatus('All uploads complete!');
  }

  return (
    <div>
      <h2>Upload files</h2>
      <input type="file" multiple onChange={e=>setFiles(e.target.files)} />
      <button onClick={onUpload} disabled={!files || files.length===0}>Upload</button>
      <p>{status}</p>
    </div>
  );
}
