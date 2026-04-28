"use client";

import { useEffect, useMemo, useState } from "react";
import { formatBytes, formatDate } from "@/lib/file-utils";

type AdminFile = {
  kind: "file";
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

type AdminFolder = {
  kind: "folder";
  id: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  itemCount: number;
  createdAt: string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
};

type AdminItem = AdminFile | AdminFolder;
type ItemFilter = "all" | "files" | "folders";
const ITEMS_PER_PAGE = 25;

export function AdminFileManager() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ItemFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "files" && item.kind !== "file") return false;
      if (filter === "folders" && item.kind !== "folder") return false;

      if (!query) return true;

      const ownerEmail = item.ownerEmail?.toLowerCase() ?? "";
      const ownerName = item.ownerName?.toLowerCase() ?? "";
      const name = item.kind === "file" ? item.filename.toLowerCase() : item.title.toLowerCase();

      return (
        name.includes(query) ||
        ownerEmail.includes(query) ||
        ownerName.includes(query) ||
        item.ownerId.toLowerCase().includes(query)
      );
    });
  }, [items, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/files", { cache: "no-store" });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to load files");
      }
      const data: AdminItem[] = await res.json();
      setItems(data);
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
        <p style={{ margin: 0, color: "var(--drive-muted)" }}>
          Review every uploaded asset across the workspace and remove items that break policy or are no longer needed.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by name or owner"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "var(--drive-radius-sm)",
            border: "1px solid var(--drive-border)",
            minWidth: 220,
            background: "var(--drive-surface)",
            color: "var(--drive-text)",
          }}
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as ItemFilter)}
          style={{
            padding: "6px 10px",
            borderRadius: "var(--drive-radius-sm)",
            border: "1px solid var(--drive-border)",
            background: "var(--drive-surface)",
            color: "var(--drive-text)",
          }}
        >
          <option value="all">All</option>
          <option value="files">Files</option>
          <option value="folders">Folders</option>
        </select>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="drive-button-muted"
          style={{ padding: "0.45rem 1rem" }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: "var(--drive-radius-sm)",
            background: "var(--drive-error-bg)",
            color: "var(--drive-error-text)",
            border: "1px solid var(--drive-error-border)",
          }}
        >
          {error}
        </div>
      )}
      {status && !error && (
        <div
          style={{
            padding: 12,
            borderRadius: "var(--drive-radius-sm)",
            background: "var(--drive-info-bg)",
            color: "var(--drive-info-text)",
            border: "1px solid var(--drive-info-border)",
          }}
        >
          {status}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>
          {filteredItems.length === 0
            ? "Showing 0 results"
            : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} of ${filteredItems.length}`}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="drive-button-ghost"
          >
            Previous
          </button>
          <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="drive-button-ghost"
          >
            Next
          </button>
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--drive-border)",
          borderRadius: "var(--drive-radius-md)",
          overflow: "hidden",
          background: "var(--drive-surface)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--drive-muted-surface)" }}>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "var(--drive-muted)",
                  textTransform: "uppercase",
                }}
              >
                Name
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "var(--drive-muted)",
                  textTransform: "uppercase",
                }}
              >
                Owner
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "var(--drive-muted)",
                  textTransform: "uppercase",
                }}
              >
                Details
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "var(--drive-muted)",
                  textTransform: "uppercase",
                }}
              >
                Uploaded
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "var(--drive-muted)",
                  textTransform: "uppercase",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--drive-muted)" }}>
                  {loading ? "Loading items…" : "No items found."}
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const ownerLabel = item.ownerName || item.ownerEmail || "Unknown";
                return (
                  <tr key={item.id} style={{ borderTop: "1px solid var(--drive-border)" }}>
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <div style={{ display: "grid", gap: 4 }}>
                        <strong style={{ fontSize: 14 }}>
                          {item.kind === "file" ? item.filename : item.title}
                        </strong>
                        <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>
                          {item.kind === "file" ? "File" : "Folder"}
                        </span>
                        {item.kind === "file" ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 12, color: "var(--drive-accent)" }}
                          >
                            Open file
                          </a>
                        ) : (
                          <a href={`/gallery/${item.id}`} style={{ fontSize: 12, color: "var(--drive-accent)" }}>
                            Open folder
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <div style={{ display: "grid", gap: 2 }}>
                        <span style={{ fontSize: 13 }}>{ownerLabel}</span>
                        <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>{item.ownerEmail}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "top", fontSize: 13 }}>
                      {item.kind === "file" ? formatBytes(item.bytes) : `${item.itemCount} item${item.itemCount === 1 ? "" : "s"}`}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "top", fontSize: 13 }}>
                      <div style={{ display: "grid", gap: 2 }}>
                        <span>{formatDate(item.createdAt)}</span>
                        {item.kind === "folder" ? (
                          <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>
                            {item.visibility === "PRIVATE" ? "Private" : "Public"}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "top", textAlign: "right" }}>
                      {item.kind === "file" ? (
                        <button
                          onClick={() => void handleDelete(item)}
                          disabled={busyId === item.id}
                          className="drive-button-danger"
                          style={{ padding: "0.45rem 1rem" }}
                        >
                          {busyId === item.id ? "Deleting…" : "Delete"}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--drive-muted)" }}>Manage in folder view</span>
                      )}
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
