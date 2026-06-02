"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

export function UploadClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [galleries, setGalleries] = useState<Array<{ id: string; title: string; role: "OWNER" | "MANAGER" }>>([]);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loadingGalleries, setLoadingGalleries] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function addFiles(newFiles: File[]) {
    if (newFiles.length === 0) return;
    setFiles((prev) => {
      const existingNames = new Set(prev.map((file) => file.name));
      const deduped = newFiles.filter((file) => !existingNames.has(file.name));
      return deduped.length ? [...prev, ...deduped] : prev;
    });
  }

  async function loadGalleries() {
    try {
      setLoadingGalleries(true);
      setError("");
      const response = await fetch("/api/galleries?scope=mine", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load folders.");
      }
      const data: Array<{ id: string; title: string; role: "OWNER" | "MANAGER" }> = await response.json();
      setGalleries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load folders.";
      setError(message);
    } finally {
      setLoadingGalleries(false);
    }
  }

  useEffect(() => {
    void loadGalleries();
  }, []);

  async function onUpload() {
    if (files.length === 0) return;
    setStatus("");
    setError("");
    for (const file of files) {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
          galleryIds: selectedGalleryIds,
        }),
      });
      if (!response.ok) {
        const message = await response.text();
        setError(message || "Failed to start upload.");
        return;
      }
      const { url, key } = await response.json();
      setStatus(`Uploading ${file.name}...`);
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!uploadResponse.ok) {
        setError(`Failed to upload ${file.name}.`);
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const checksum = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
        await fetch("/api/upload/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, checksum }),
        });
      } catch {
        // Non-blocking: checksum confirmation is best-effort
      }
    }
    setStatus(
      selectedGalleryIds.length > 0
        ? "All uploads complete and added to the selected folder(s)."
        : "All uploads complete!"
    );
    setFiles([]);
  }

  function onGallerySelectionChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setSelectedGalleryIds(selected);
  }

  function onFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;
    addFiles(Array.from(event.target.files));
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!isDragActive) setIsDragActive(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragActive(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Upload files</h2>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Add uploads to folder(s)</label>
        <select
          multiple
          value={selectedGalleryIds}
          onChange={onGallerySelectionChange}
          className="w-full min-h-28 border border-gray-300 rounded-md p-2 text-sm"
          disabled={loadingGalleries || galleries.length === 0}
        >
          {galleries.map((gallery) => (
            <option key={gallery.id} value={gallery.id}>
              {gallery.title}
              {gallery.role === "MANAGER" ? " (Shared)" : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          {loadingGalleries
            ? "Loading folders…"
            : galleries.length === 0
              ? "No folders available. You can still upload files."
              : "Hold Ctrl (Windows) or Command (Mac) to choose multiple folders."}
        </p>
      </div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFileInputChange} />
        <p className="text-sm text-gray-600">
          Drag and drop files here, or <span className="text-blue-600 font-medium">browse</span> to select
        </p>
        {files.length > 0 && (
          <ul className="mt-4 text-left space-y-1 text-sm text-gray-700">
            {files.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={onUpload}
        disabled={files.length === 0}
      >
        Upload
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {status && !error && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
