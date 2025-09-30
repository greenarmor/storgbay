"use client";

import { useEffect, useMemo, useState } from "react";
import { formatBytes, formatDate } from "@/lib/file-utils";

type AdminFile = {
  id: string;
  filename: string;
  mime: string | null;
  bytes: number;
  createdAt: string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  url: string;
};

export function AdminFileManager() {
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  const filteredFiles = useMemo(() => {
    if (!search) return files;
    const query = search.toLowerCase();
    return files.filter((file) => {
      const ownerEmail = file.ownerEmail?.toLowerCase() ?? "";
      const ownerName = file.ownerName?.toLowerCase() ?? "";
      return (
        file.filename.toLowerCase().includes(query) ||
        ownerEmail.includes(query) ||
        ownerName.includes(query) ||
        file.ownerId.toLowerCase().includes(query)
      );
    });
  }, [files, search]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/files", { cache: "no-store" });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to load files");
      }
      const data: AdminFile[] = await res.json();
      setFiles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load files.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(file: AdminFile) {
    if (!window.confirm(`Delete ${file.filename}? This cannot be undone.`)) {
      return;
    }
    setBusyId(file.id);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to delete file");
      }
      setStatus(`Deleted ${file.filename}.`);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete file.";
      setError(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>Uploaded files</h2>
        <p style={{ margin: 0, color: "#555" }}>
          Review every uploaded asset across the workspace and remove items that break policy or are no longer needed.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by file or owner"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", minWidth: 220 }}
        />
        <button onClick={() => void refresh()} disabled={loading} style={{ padding: "6px 12px", borderRadius: 6 }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div style={{ padding: 12, borderRadius: 8, background: "#fee2e2", color: "#7f1d1d" }}>{error}</div>}
      {status && !error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#e0f2fe", color: "#1d4ed8" }}>{status}</div>
      )}

      <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, color: "#555", textTransform: "uppercase" }}>
                File
              </th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, color: "#555", textTransform: "uppercase" }}>
                Owner
              </th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, color: "#555", textTransform: "uppercase" }}>
                Size
              </th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, color: "#555", textTransform: "uppercase" }}>
                Uploaded
              </th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, color: "#555", textTransform: "uppercase" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#666" }}>
                  {loading ? "Loading files…" : "No files found."}
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => {
                const ownerLabel = file.ownerName || file.ownerEmail || "Unknown";
                return (
                  <tr key={file.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <div style={{ display: "grid", gap: 4 }}>
                        <strong style={{ fontSize: 14 }}>{file.filename}</strong>
                        <span style={{ fontSize: 12, color: "#666" }}>{file.mime}</span>
                        <a href={file.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#1a73e8" }}>
                          Open file
                        </a>
                      </div>
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <div style={{ display: "grid", gap: 2 }}>
                        <span style={{ fontSize: 13 }}>{ownerLabel}</span>
                        <span style={{ fontSize: 12, color: "#777" }}>{file.ownerEmail}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "top", fontSize: 13 }}>{formatBytes(file.bytes)}</td>
                    <td style={{ padding: "12px", verticalAlign: "top", fontSize: 13 }}>{formatDate(file.createdAt)}</td>
                    <td style={{ padding: "12px", verticalAlign: "top", textAlign: "right" }}>
                      <button
                        onClick={() => void handleDelete(file)}
                        disabled={busyId === file.id}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          cursor: busyId === file.id ? "wait" : "pointer",
                        }}
                      >
                        {busyId === file.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
