"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { formatBytes, formatDate, isAudio, isImage, isPdf, isVideo } from "@/lib/file-utils";

export type GalleryFile = {
  id: string;
  filename: string;
  mime: string | null;
  bytes: number;
  createdAt: string;
  _url: string;
};

export type GalleryInfo = {
  id: string;
  title: string;
  description?: string | null;
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

function matchesFilter(file: GalleryFile, filter: Filter): boolean {
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

function MediaPreview({ file, onClick }: { file: GalleryFile; onClick?: () => void }) {
  const imageStyles = { width: "100%", height: "auto", borderRadius: 8, cursor: onClick ? "pointer" : "default" } as const;

  if (isImage(file.mime)) {
    return <Image src={file._url} alt={file.filename} width={800} height={600} style={imageStyles} onClick={onClick} />;
  }

  if (isVideo(file.mime)) {
    return <video src={file._url} controls style={{ width: "100%", borderRadius: 8 }} />;
  }

  if (isAudio(file.mime)) {
    return <audio src={file._url} controls style={{ width: "100%" }} />;
  }

  if (isPdf(file.mime)) {
    return <iframe src={file._url} style={{ width: "100%", height: 280, border: "1px solid #eee", borderRadius: 8 }} />;
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        background: "#fafafa",
        border: "1px dashed #ddd",
        borderRadius: 8,
        height: 200,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <span>{file.mime || "file"}</span>
    </div>
  );
}

export function GalleryViewer({ gallery, files }: { gallery: GalleryInfo; files: GalleryFile[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      if (search && !file.filename.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return matchesFilter(file, filter);
    });
  }, [files, filter, search]);

  useEffect(() => {
    if (activeIndex !== null && activeIndex >= filteredFiles.length) {
      setActiveIndex(filteredFiles.length > 0 ? 0 : null);
      setIsPlaying(false);
    }
  }, [filteredFiles.length, activeIndex]);

  useEffect(() => {
    if (activeIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setActiveIndex(null);
        setIsPlaying(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIndex((current) => {
          if (current === null || filteredFiles.length === 0) return null;
          return (current + 1) % filteredFiles.length;
        });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIndex((current) => {
          if (current === null || filteredFiles.length === 0) return null;
          return current === 0 ? filteredFiles.length - 1 : current - 1;
        });
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, filteredFiles.length]);

  useEffect(() => {
    if (activeIndex === null || !isPlaying || filteredFiles.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current === null || filteredFiles.length === 0) return null;
        return (current + 1) % filteredFiles.length;
      });
    }, 5000);
    return () => window.clearInterval(interval);
  }, [activeIndex, isPlaying, filteredFiles.length]);

  const activeFile = activeIndex !== null ? filteredFiles[activeIndex] : null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{ margin: 0 }}>{gallery.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {gallery.visibility === "PRIVATE" && (
            <span
              style={{
                padding: "2px 8px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 12,
                background: "#fafafa",
              }}
            >
              Private
            </span>
          )}
          {gallery.description && <span style={{ color: "#555" }}>{gallery.description}</span>}
          <span style={{ color: "#666" }}>{files.length} file{files.length === 1 ? "" : "s"}</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <input
            type="search"
            placeholder="Search files"
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
          {filteredFiles.length > 0 && (
            <button
              onClick={() => {
                setActiveIndex(0);
                setIsPlaying(true);
              }}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #1a73e8", background: "#1a73e8", color: "#fff" }}
            >
              Start slideshow
            </button>
          )}
        </div>
      </header>

      {files.length === 0 ? (
        <div style={{ padding: 24, background: "#fafafa", borderRadius: 8, border: "1px solid #eee" }}>
          <p style={{ margin: 0 }}>This gallery is empty. Upload files and add them from your library to get started.</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div style={{ padding: 24, background: "#fafafa", borderRadius: 8, border: "1px solid #eee" }}>
          <p style={{ margin: 0 }}>No files match your filters.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {filteredFiles.map((file, index) => (
            <div
              key={file.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
                display: "grid",
                gap: 8,
                boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
              }}
            >
              <MediaPreview file={file} onClick={() => { setIsPlaying(false); setActiveIndex(index); }} />
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.filename}
                </strong>
                <span style={{ fontSize: 12, color: "#555" }}>{file.mime}</span>
                <span style={{ fontSize: 12, color: "#777" }}>{formatBytes(file.bytes)}</span>
                <span style={{ fontSize: 12, color: "#777" }}>{formatDate(file.createdAt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <button
                  onClick={() => { setIsPlaying(false); setActiveIndex(index); }}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #1a73e8", background: "#1a73e8", color: "#fff" }}
                >
                  View
                </button>
                <a href={file._url} download style={{ fontSize: 12, color: "#1a73e8" }}>
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeFile && (
        <div
          role="dialog"
          aria-modal
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            flexDirection: "column",
            padding: 24,
            zIndex: 1000,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
            <div style={{ display: "grid" }}>
              <strong>{activeFile.filename}</strong>
              <small>{activeFile.mime}</small>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setIsPlaying((value) => !value)}
                style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#1a73e8", color: "#fff" }}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                onClick={() =>
                  setActiveIndex((current) => {
                    if (current === null || filteredFiles.length === 0) return null;
                    return current === 0 ? filteredFiles.length - 1 : current - 1;
                  })
                }
                style={{ padding: "6px 12px", borderRadius: 6, border: "none" }}
              >
                ◀ Prev
              </button>
              <button
                onClick={() =>
                  setActiveIndex((current) => {
                    if (current === null || filteredFiles.length === 0) return null;
                    return (current + 1) % filteredFiles.length;
                  })
                }
                style={{ padding: "6px 12px", borderRadius: 6, border: "none" }}
              >
                Next ▶
              </button>
              <button
                onClick={() => {
                  setActiveIndex(null);
                  setIsPlaying(false);
                }}
                style={{ padding: "6px 12px", borderRadius: 6, border: "none" }}
              >
                Close ✕
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: "grid", placeItems: "center", marginTop: 24 }}>
            {isImage(activeFile.mime) ? (
              <Image
                src={activeFile._url}
                alt={activeFile.filename}
                width={1200}
                height={800}
                style={{ maxWidth: "100%", height: "auto", borderRadius: 12 }}
              />
            ) : isVideo(activeFile.mime) ? (
              <video
                src={activeFile._url}
                controls
                autoPlay={isPlaying}
                style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12 }}
              />
            ) : isAudio(activeFile.mime) ? (
              <audio src={activeFile._url} controls autoPlay={isPlaying} style={{ width: "100%" }} />
            ) : isPdf(activeFile.mime) ? (
              <iframe
                src={activeFile._url}
                style={{ width: "90vw", height: "80vh", border: "none", borderRadius: 12, background: "#fff" }}
              />
            ) : (
              <div
                style={{
                  color: "#fff",
                  background: "rgba(255,255,255,0.1)",
                  padding: 32,
                  borderRadius: 12,
                  textAlign: "center",
                }}
              >
                <p>{activeFile.mime || "Unsupported file"}</p>
                <a href={activeFile._url} download style={{ color: "#8ab4f8" }}>
                  Download file
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
