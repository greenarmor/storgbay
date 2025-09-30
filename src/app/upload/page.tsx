'use client';
import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

export default function UploadPage(){
  const [files,setFiles] = useState<File[]>([]);
  const [status,setStatus] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement|null>(null);

  function addFiles(newFiles: File[]){
    if(newFiles.length === 0) return;
    setFiles(prev => {
      const existingNames = new Set(prev.map(file => file.name));
      const deduped = newFiles.filter(file => !existingNames.has(file.name));
      return deduped.length ? [...prev, ...deduped] : prev;
    });
  }

  async function onUpload(){
    if(files.length===0) return;
    for (const file of files){
      const r = await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name,mime:file.type||'application/octet-stream'})});
      const { url } = await r.json();
      setStatus(`Uploading ${file.name}...`);
      await fetch(url,{method:'PUT',body:file,headers:{'Content-Type':file.type||'application/octet-stream'}});
    }
    setStatus('All uploads complete!');
    setFiles([]);
  }

  function onFileInputChange(event: ChangeEvent<HTMLInputElement>){
    if(!event.target.files) return;
    addFiles(Array.from(event.target.files));
    event.target.value = '';
  }

  function onDrop(event: DragEvent<HTMLDivElement>){
    event.preventDefault();
    setIsDragActive(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function onDragOver(event: DragEvent<HTMLDivElement>){
    event.preventDefault();
    if(!isDragActive) setIsDragActive(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>){
    event.preventDefault();
    if(event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragActive(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Upload files</h2>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onFileInputChange}
        />
        <p className="text-sm text-gray-600">
          Drag and drop files here, or <span className="text-blue-600 font-medium">browse</span> to select
        </p>
        {files.length > 0 && (
          <ul className="mt-4 text-left space-y-1 text-sm text-gray-700">
            {files.map(file => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={onUpload}
        disabled={files.length===0}
      >
        Upload
      </button>
      <p className="text-sm text-gray-700">{status}</p>
    </div>
  );
}
