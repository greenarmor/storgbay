"use client";

import { FormEvent, useState } from "react";

type Manager = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  addedAt: string;
};

type Props = {
  galleryId: string;
  initialManagers: Manager[];
  canEdit: boolean;
  ownerLabel: string;
};

export function GalleryManagersPanel({ galleryId, initialManagers, canEdit, ownerLabel }: Props) {
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function resetMessages() {
    setStatus(null);
    setError(null);
  }

  async function refreshManagers() {
    resetMessages();
    setRefreshing(true);
    try {
      const response = await fetch(`/api/galleries/${galleryId}/managers`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to refresh managers");
      }
      const data: Manager[] = await response.json();
      setManagers(data);
      setStatus("Manager list updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to refresh managers.";
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAddManager(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const response = await fetch(`/api/galleries/${galleryId}/managers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to add manager");
      }
      const newManager: Manager = await response.json();
      setManagers((prev) => {
        const exists = prev.some((m) => m.userId === newManager.userId);
        if (exists) {
          return prev.map((m) => (m.userId === newManager.userId ? newManager : m));
        }
        return [...prev, newManager].sort((a, b) => a.addedAt.localeCompare(b.addedAt));
      });
      setEmail("");
      setStatus("Manager added successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to add manager.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveManager(userId: string) {
    if (!window.confirm("Remove this manager from the gallery?")) {
      return;
    }
    resetMessages();
    setBusyId(userId);
    try {
      const response = await fetch(`/api/galleries/${galleryId}/managers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to remove manager");
      }
      setManagers((prev) => prev.filter((manager) => manager.userId !== userId));
      setStatus("Manager removed.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to remove manager.";
      setError(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section style={{ display: "grid", gap: 12, background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0 }}>Gallery managers</h2>
        <p style={{ margin: 0, color: "#555" }}>
          The owner ({ownerLabel}) can manage this gallery. Add uploaders or admins to help curate it.
        </p>
      </header>

      {status && (
        <div style={{ padding: "8px 12px", borderRadius: 8, background: "#e6f4ea", color: "#137333" }}>{status}</div>
      )}
      {error && (
        <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fce8e6", color: "#c5221f" }}>{error}</div>
      )}

      {canEdit && (
        <form onSubmit={handleAddManager} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <label style={{ display: "grid", gap: 4, flex: "1 1 240px" }}>
            <span style={{ fontWeight: 600 }}>Invite by email</span>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #1a73e8", background: "#1a73e8", color: "#fff" }}
          >
            {loading ? "Adding…" : "Add manager"}
          </button>
        </form>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        <strong>Managers</strong>
        {managers.length === 0 ? (
          <p style={{ margin: 0, color: "#666" }}>No additional managers yet.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {managers.map((manager) => (
              <li
                key={manager.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, border: "1px solid #eee", borderRadius: 10, padding: "10px 12px" }}
              >
                <div style={{ display: "grid" }}>
                  <span style={{ fontWeight: 600 }}>{manager.name || manager.email || "Unknown user"}</span>
                  {manager.email && <span style={{ color: "#666" }}>{manager.email}</span>}
                </div>
                {canEdit && (
                  <button
                    onClick={() => void handleRemoveManager(manager.userId)}
                    disabled={busyId === manager.userId}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d93025", background: "#fff", color: "#d93025" }}
                  >
                    {busyId === manager.userId ? "Removing…" : "Remove"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!canEdit && (
        <button
          onClick={() => void refreshManagers()}
          disabled={refreshing}
          style={{ padding: "6px 10px", borderRadius: 6, width: "fit-content" }}
        >
          {refreshing ? "Refreshing…" : "Refresh list"}
        </button>
      )}
    </section>
  );
}
