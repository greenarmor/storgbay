"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatBytes, formatDate, isAnimatedImage, isAudio, isImage, isPdf, isVideo } from "@/lib/file-utils";

type LibraryFile = {
  id: string;
  filename: string;
  mime: string | null;
  bytes: number;
  createdAt: string;
  url: string;
};

type LibraryGallery = {
  id: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
};

type Filter = "all" | "images" | "videos" | "audio" | "documents" | "other";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All files" },
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "documents", label: "PDFs" },
  { value: "other", label: "Other" },
];

function matchesFilter(file: LibraryFile, filter: Filter): boolean {
  switch (filter) {
    case "images":
      return isImage(file.mime);
    case "videos":
      return isVideo(file.mime);
    case "audio":
      return isAudio(file.mime);
    case "documents":
      return isPdf(file.mime);
    case "other":
      return !isImage(file.mime) && !isVideo(file.mime) && !isAudio(file.mime) && !isPdf(file.mime);
    default:
      return true;
  }
}

export function FileManager({ initialSearch = "" }: { initialSearch?: string } = {}) {
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [galleries, setGalleries] = useState<LibraryGallery[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      if (search && !file.filename.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return matchesFilter(file, filter);
    });
  }, [files, filter, search]);

  useEffect(() => {
    void refreshLibrary();
  }, []);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  async function refreshLibrary() {
    try {
      setLoading(true);
      setError(null);
      const [filesRes, galleriesRes] = await Promise.all([
        fetch("/api/files", { cache: "no-store" }),
        fetch("/api/galleries?scope=mine", { cache: "no-store" }),
      ]);

      if (!filesRes.ok) {
        throw new Error(`Failed to load files (${filesRes.status})`);
      }
      const fileData: LibraryFile[] = await filesRes.json();
      setFiles(fileData);

      if (galleriesRes.ok) {
        const galleryData: LibraryGallery[] = await galleriesRes.json();
        setGalleries(galleryData);
        if (galleryData.length > 0) {
          setSelectedGalleryId((current) => current || galleryData[0].id);
        }
      } else if (galleriesRes.status === 401) {
        setGalleries([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load media library.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const ids = filteredFiles.map((file) => file.id);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleDeleteSelected() {
    const fileIds = Array.from(selectedIds);
    if (fileIds.length === 0) {
      setStatus("Select one or more files first.");
      return;
    }
    const confirmMessage =
      fileIds.length === 1
        ? "Delete this file? This action cannot be undone."
        : `Delete ${fileIds.length} files? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      for (const fileId of fileIds) {
        const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || "Failed to delete file.");
        }
      }
      setStatus(`Deleted ${fileIds.length} file${fileIds.length === 1 ? "" : "s"}.`);
      clearSelection();
      await refreshLibrary();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete selected files.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateGallery() {
    const fileIds = Array.from(selectedIds);
    if (fileIds.length === 0) {
      setStatus("Select one or more files first.");
      return;
    }
    const title = window.prompt("Gallery title", "New gallery");
    if (!title) return;
    const makePublic = window.confirm("Make this gallery public? Click OK for public, Cancel for private.");
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, visibility: makePublic ? "PUBLIC" : "PRIVATE", fileIds }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create gallery");
      }
      setStatus(`Created gallery "${title}" with ${fileIds.length} file${fileIds.length === 1 ? "" : "s"}.`);
      clearSelection();
      await refreshLibrary();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create gallery.";
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddToGallery() {
    const fileIds = Array.from(selectedIds);
    if (!selectedGalleryId) {
      setStatus("Choose a gallery first.");
      return;
    }
    if (fileIds.length === 0) {
      setStatus("Select one or more files first.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/galleries/${selectedGalleryId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to add files to gallery");
      }
      const payload = await res.json();
      setStatus(`Added ${payload.added ?? fileIds.length} file${fileIds.length === 1 ? "" : "s"} to the gallery.`);
      clearSelection();
      await refreshLibrary();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add files to gallery.";
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  const hasFiles = filteredFiles.length > 0;
  const selectedCount = selectedIds.size;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <strong>File library</strong>
          <button onClick={() => void refreshLibrary()} disabled={loading} style={{ padding: "4px 10px", borderRadius: 6 }}>
            Refresh
          </button>
          <Link href="/upload" style={{ fontSize: 14, color: "#1a73e8" }}>
            Upload more files
          </Link>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", minWidth: 200 }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fee2e2", color: "#7f1d1d" }}>{error}</div>
      )}
      {status && !error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#e0f2fe", color: "#1d4ed8" }}>{status}</div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span>{selectedCount} selected</span>
        <button onClick={toggleSelectAll} disabled={!hasFiles} style={{ padding: "4px 10px", borderRadius: 6 }}>
          {hasFiles && filteredFiles.every((file) => selectedIds.has(file.id)) ? "Unselect all" : "Select all"}
        </button>
        <button onClick={clearSelection} disabled={selectedCount === 0} style={{ padding: "4px 10px", borderRadius: 6 }}>
          Clear selection
        </button>
        <button
          onClick={() => void handleDeleteSelected()}
          disabled={selectedCount === 0 || busy}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            background: "#dc2626",
            color: "white",
            border: "none",
            cursor: selectedCount === 0 || busy ? "not-allowed" : "pointer",
          }}
        >
          Delete selected
        </button>
        <button onClick={handleCreateGallery} disabled={selectedCount === 0 || busy} style={{ padding: "6px 12px", borderRadius: 6 }}>
          Create gallery from selection
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={selectedGalleryId}
            onChange={(e) => setSelectedGalleryId(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}
          >
            <option value="">Choose gallery…</option>
            {galleries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} {g.visibility === "PRIVATE" ? "(Private)" : ""}
              </option>
            ))}
          </select>
          <button onClick={handleAddToGallery} disabled={selectedCount === 0 || busy || !selectedGalleryId} style={{ padding: "6px 12px", borderRadius: 6 }}>
            Add to gallery
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: hasFiles ? "repeat(auto-fill, minmax(220px, 1fr))" : "1fr",
        }}
      >
        {loading && files.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", borderRadius: 8, border: "1px solid #eee" }}>Loading files…</div>
        ) : !hasFiles ? (
          <div style={{ padding: 32, textAlign: "center", borderRadius: 8, border: "1px solid #eee" }}>
            <p style={{ marginBottom: 12 }}>You have no uploads yet.</p>
            <Link href="/upload" style={{ color: "#1a73e8" }}>
              Go to the upload page
            </Link>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedIds.has(file.id);
            return (
              <label
                key={file.id}
                style={{
                  border: isSelected ? "2px solid #1a73e8" : "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                  display: "grid",
                  gap: 8,
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 0 0 3px rgba(26,115,232,0.2)" : "0 1px 2px rgba(15,23,42,0.08)",
                  background: "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(file.id)}
                  style={{ justifySelf: "start" }}
                />
                <div style={{ width: "100%", borderRadius: 8, overflow: "hidden" }}>
                  {isImage(file.mime) ? (
                    <Image
                      src={file.url}
                      alt={file.filename}
                      width={640}
                      height={480}
                      style={{ width: "100%", height: "auto" }}
                      unoptimized={isAnimatedImage(file.mime, file.filename)}
                    />
                  ) : isVideo(file.mime) ? (
                    <video src={file.url} controls style={{ width: "100%", borderRadius: 8 }} />
                  ) : isAudio(file.mime) ? (
                    <audio src={file.url} controls style={{ width: "100%" }} />
                  ) : isPdf(file.mime) ? (
                    <iframe src={file.url} style={{ width: "100%", height: 200, border: "1px solid #eee", borderRadius: 8 }} />
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        placeItems: "center",
                        background: "#fafafa",
                        border: "1px dashed #ddd",
                        borderRadius: 8,
                        height: 180,
                      }}
                    >
                      <span>{file.mime || "file"}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.filename}
                  </strong>
                  <span style={{ fontSize: 12, color: "#555" }}>{file.mime}</span>
                  <span style={{ fontSize: 12, color: "#777" }}>{formatBytes(file.bytes)}</span>
                  <span style={{ fontSize: 12, color: "#777" }}>{formatDate(file.createdAt)}</span>
                  <a href={file.url} download style={{ fontSize: 12, color: "#1a73e8" }}>
                    Download
                  </a>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
