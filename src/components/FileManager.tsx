"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatBytes,
  formatDate,
  isAnimatedImage,
  isAudio,
  isDocumentFile,
  isImage,
  isPdf,
  isVideo,
} from "@/lib/file-utils";

type LibraryFileItem = {
  kind: "file";
  id: string;
  filename: string;
  mime: string | null;
  bytes: number;
  createdAt: string;
  url: string;
};

type LibraryGalleryItem = {
  kind: "gallery";
  id: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  ownerId: string;
  ownerLabel: string;
  role: "OWNER" | "MANAGER";
  itemCount: number;
  createdAt: string;
};

type LibraryItem = LibraryFileItem | LibraryGalleryItem;

type Filter =
  | "all"
  | "images"
  | "videos"
  | "audio"
  | "documents"
  | "other"
  | "galleries";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All items" },
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "documents", label: "Documents" },
  { value: "other", label: "Other" },
  { value: "galleries", label: "Folders" },
];

function isFileItem(item: LibraryItem): item is LibraryFileItem {
  return item.kind === "file";
}

function isGalleryItem(item: LibraryItem): item is LibraryGalleryItem {
  return item.kind === "gallery";
}

function matchesFilter(file: LibraryFileItem, filter: Filter): boolean {
  switch (filter) {
    case "images":
      return isImage(file.mime);
    case "videos":
      return isVideo(file.mime);
    case "audio":
      return isAudio(file.mime);
    case "documents":
      return isPdf(file.mime, file.filename) || isDocumentFile(file.mime, file.filename);
    case "other":
      return !isImage(file.mime) && !isVideo(file.mime) && !isAudio(file.mime) && !isPdf(file.mime, file.filename);
    default:
      return true;
  }
}

export function FileManager({ initialSearch = "" }: { initialSearch?: string } = {}) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fileItems = useMemo(() => items.filter(isFileItem), [items]);
  const galleryItems = useMemo(() => items.filter(isGalleryItem), [items]);

  useEffect(() => {
    if (galleryItems.length > 0) {
      setSelectedGalleryId((current) => current || galleryItems[0]?.id || "");
    } else {
      setSelectedGalleryId("");
    }
  }, [galleryItems]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (query) {
        if (isFileItem(item)) {
          if (!item.filename.toLowerCase().includes(query)) {
            return false;
          }
        } else if (
          !item.title.toLowerCase().includes(query) &&
          !item.ownerLabel.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      if (isFileItem(item)) {
        return filter === "galleries" ? false : matchesFilter(item, filter);
      }

      if (filter === "galleries") {
        return true;
      }

      // Folders are shown in the "all" view to keep type filters scoped to files.
      return filter === "all";
    });
  }, [items, filter, search]);

  const filteredFileItems = useMemo(
    () => filteredItems.filter(isFileItem),
    [filteredItems]
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const availableIds = new Set(fileItems.map((file) => file.id));
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (availableIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [fileItems]);

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
      const res = await fetch("/api/library", { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`Failed to load library (${res.status})`);
      }
      const data: LibraryItem[] = await res.json();
      setItems(data);
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
      const ids = filteredFileItems.map((file) => file.id);
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

  const selectedCount = selectedIds.size;
  const hasAnyItems = items.length > 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <strong>File library</strong>
          <button onClick={() => void refreshLibrary()} disabled={loading} className="drive-button-ghost">
            Refresh
          </button>
          <Link href="/upload" style={{ fontSize: 14, color: "var(--drive-accent)" }}>
            Upload more files
          </Link>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="drive-alert drive-alert--error">{error}</div>}
      {status && !error && <div className="drive-alert drive-alert--info">{status}</div>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span>{selectedCount} selected</span>
        <button
          onClick={toggleSelectAll}
          disabled={filteredFileItems.length === 0}
          className="drive-button-ghost"
        >
          {filteredFileItems.length > 0 && filteredFileItems.every((file) => selectedIds.has(file.id))
            ? "Unselect all"
            : "Select all"}
        </button>
        <button onClick={clearSelection} disabled={selectedCount === 0} className="drive-button-ghost">
          Clear selection
        </button>
        <button
          onClick={() => void handleDeleteSelected()}
          disabled={selectedCount === 0 || busy}
          className="drive-button-danger"
          style={{ cursor: selectedCount === 0 || busy ? "not-allowed" : "pointer" }}
        >
          Delete selected
        </button>
        <button
          onClick={handleCreateGallery}
          disabled={selectedCount === 0 || busy}
          style={{
            padding: "0.6rem 1.1rem",
            borderRadius: "var(--drive-radius-sm)",
            border: "1px solid var(--drive-accent)",
            background: "var(--drive-accent)",
            color: "#fff",
            boxShadow: "none",
          }}
        >
          Create folder from selection
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={selectedGalleryId}
            onChange={(e) => setSelectedGalleryId(e.target.value)}
          >
            <option value="">Choose gallery…</option>
            {galleryItems.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
                {g.visibility === "PRIVATE" ? " (Private)" : ""}
                {g.role === "MANAGER" ? " (Shared)" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddToGallery}
            disabled={selectedCount === 0 || busy || !selectedGalleryId}
            className="drive-button-muted"
          >
            Add to folder
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns:
            filteredItems.length > 0 ? "repeat(auto-fill, minmax(220px, 1fr))" : "1fr",
        }}
      >
        {loading && items.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              borderRadius: "var(--drive-radius-sm)",
              border: "1px solid var(--drive-border)",
              background: "var(--drive-surface)",
            }}
          >
            Loading items…
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              borderRadius: "var(--drive-radius-sm)",
              border: "1px solid var(--drive-border)",
              background: "var(--drive-surface)",
            }}
          >
            {hasAnyItems ? (
              <p style={{ margin: 0 }}>No items match your filters.</p>
            ) : (
              <>
                <p style={{ marginBottom: 12 }}>You have no uploads yet.</p>
                <Link href="/upload" style={{ color: "var(--drive-accent)" }}>
                  Go to the upload page
                </Link>
              </>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            if (isFileItem(item)) {
              const isSelected = selectedIds.has(item.id);
              const isDocument = isDocumentFile(item.mime, item.filename);
              return (
                <label
                  key={item.id}
                  style={{
                    border: isSelected ? "2px solid var(--drive-accent)" : "1px solid var(--drive-border)",
                    borderRadius: "var(--drive-radius-sm)",
                    padding: 12,
                    display: "grid",
                    gap: 8,
                    cursor: "pointer",
                    boxShadow: isSelected ? `0 0 0 3px var(--drive-selection-ring)` : "0 1px 2px rgba(15,23,42,0.08)",
                    background: "var(--drive-surface)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(item.id)}
                    style={{ justifySelf: "start" }}
                  />
                  <div style={{ width: "100%", borderRadius: 8, overflow: "hidden" }}>
                    {isImage(item.mime) ? (
                      <Image
                        src={item.url}
                        alt={item.filename}
                        width={640}
                        height={480}
                        style={{ width: "100%", height: "auto" }}
                        unoptimized={isAnimatedImage(item.mime, item.filename)}
                      />
                    ) : isVideo(item.mime) ? (
                      <video src={item.url} controls style={{ width: "100%", borderRadius: 8 }} />
                    ) : isAudio(item.mime) ? (
                      <audio src={item.url} controls style={{ width: "100%" }} />
                    ) : isPdf(item.mime, item.filename) ? (
                      <iframe
                        src={item.url}
                        style={{
                          width: "100%",
                          height: 200,
                          border: "1px solid var(--drive-border)",
                          borderRadius: "var(--drive-radius-sm)",
                          background: "var(--drive-surface)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          placeItems: "center",
                          background: "var(--drive-muted-surface)",
                          border: "1px dashed var(--drive-border)",
                          borderRadius: "var(--drive-radius-sm)",
                          height: 180,
                        }}
                      >
                        <span>{item.mime || "file"}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.filename}
                    </strong>
                    <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>{item.mime}</span>
                    <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>{formatBytes(item.bytes)}</span>
                    <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>{formatDate(item.createdAt)}</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {isDocument && (
                        <Link
                          href={`/documents?file=${item.id}`}
                          style={{ fontSize: 12, color: "var(--drive-accent)" }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Open in Document viewer
                        </Link>
                      )}
                      <a
                        href={item.url}
                        download
                        style={{ fontSize: 12, color: "var(--drive-accent)" }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </label>
              );
            }

            return (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--drive-border)",
                  borderRadius: "var(--drive-radius-sm)",
                  padding: 12,
                  display: "grid",
                  gap: 12,
                  background: "var(--drive-surface)",
                  boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    background: "var(--drive-muted-surface)",
                    borderRadius: 8,
                    height: 180,
                    border: "1px dashed var(--drive-border)",
                    color: "var(--drive-muted)",
                    fontSize: 28,
                  }}
                >
                  📁
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ fontSize: 14, display: "flex", gap: 8, alignItems: "center" }}>
                    {item.title}
                    <span
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        color: "var(--drive-muted)",
                        border: "1px solid var(--drive-border)",
                        borderRadius: 999,
                        padding: "2px 6px",
                      }}
                    >
                      {item.visibility === "PRIVATE" ? "Private" : "Public"}
                    </span>
                  </strong>
                  <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>
                    {item.role === "OWNER" ? "Owned by you" : `Shared by ${item.ownerLabel}`}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>
                    {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>Created {formatDate(item.createdAt)}</span>
                  <Link href={`/gallery/${item.id}`} style={{ fontSize: 12, color: "var(--drive-accent)" }}>
                    Open folder
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
