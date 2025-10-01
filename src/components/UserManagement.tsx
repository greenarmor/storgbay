"use client";

import { useMemo, useState, FormEvent } from "react";

type RoleValue = "USER" | "UPLOADER" | "ADMIN";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: RoleValue;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialUsers: AdminUser[];
  currentUserId: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: RoleValue;
};

const defaultFormState: FormState = {
  name: "",
  email: "",
  password: "",
  role: "UPLOADER",
};

const roleLabels: Record<RoleValue, string> = {
  USER: "Viewer",
  UPLOADER: "Uploader",
  ADMIN: "Admin",
};

export function UserManagement({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        a.createdAt === b.createdAt ? a.email?.localeCompare(b.email ?? "") ?? 0 : b.createdAt.localeCompare(a.createdAt),
      ),
    [users],
  );

  function clearMessages() {
    setFeedback(null);
    setError(null);
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    setCreating(true);
    try {
      const payload = {
        name: formState.name.trim() || null,
        email: formState.email.trim(),
        password: formState.password,
        role: formState.role,
      };

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to create user");
      }

      const createdUser: AdminUser = await response.json();
      setUsers((prev) => [createdUser, ...prev]);
      setFeedback(`User “${createdUser.email ?? createdUser.name ?? "(no email)"}” created.`);
      setFormState(() => ({ ...defaultFormState }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(userId: string, updates: Partial<{ role: RoleValue; password: string }>) {
    clearMessages();
    setBusyUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to update user");
      }

      const updatedUser: AdminUser = await response.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      setFeedback("Changes saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRoleChange(userId: string, role: RoleValue) {
    await updateUser(userId, { role });
  }

  async function handlePasswordReset(userId: string) {
    clearMessages();
    const password = window.prompt("Enter a new password for this user (min. 6 characters)");
    if (!password) return;
    if (password.length < 6) {
      setError("Passwords must be at least 6 characters long.");
      return;
    }
    await updateUser(userId, { password });
  }

  async function handleDeleteUser(userId: string) {
    clearMessages();
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    setBusyUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setFeedback("User deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <section style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Invite or add a user</h2>
        <p style={{ margin: 0, color: "var(--drive-muted)" }}>
          Admins can manage user access. Uploaders can contribute files and galleries.
        </p>
        <form
          onSubmit={handleCreateUser}
          style={{
            display: "grid",
            gap: 12,
            background: "var(--drive-surface)",
            border: "1px solid var(--drive-border)",
            borderRadius: "var(--drive-radius-md)",
            padding: 16,
            maxWidth: 520,
          }}
        >
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Name</span>
            <input
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Optional name"
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Email</span>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="user@example.com"
              required
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Temporary password</span>
            <input
              type="password"
              value={formState.password}
              onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Set an initial password"
              required
              minLength={6}
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Role</span>
            <select
              value={formState.role}
              onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value as RoleValue }))}
            >
              {Object.entries(roleLabels).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Add user"}
          </button>
        </form>
      </div>

      {(feedback || error) && (
        <div
          role="status"
          style={{ color: error ? "var(--drive-error-text)" : "var(--drive-success-text)" }}
        >
          {error ?? feedback}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Team members</h2>
        <div
          style={{
            overflowX: "auto",
            border: "1px solid var(--drive-border)",
            borderRadius: "var(--drive-radius-md)",
            background: "var(--drive-surface)",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 480, borderRadius: "inherit" }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid var(--drive-border)",
                  background: "var(--drive-muted-surface)",
                }}
              >
                <th style={{ padding: "10px 14px", fontSize: 12, color: "var(--drive-muted)" }}>Name</th>
                <th style={{ padding: "10px 14px", fontSize: 12, color: "var(--drive-muted)" }}>Email</th>
                <th style={{ padding: "10px 14px", fontSize: 12, color: "var(--drive-muted)" }}>Role</th>
                <th style={{ padding: "10px 14px", fontSize: 12, color: "var(--drive-muted)" }}>Created</th>
                <th
                  style={{ padding: "10px 14px", textAlign: "right", fontSize: 12, color: "var(--drive-muted)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--drive-border)" }}>
                  <td style={{ padding: "12px 14px" }}>{user.name ?? "—"}</td>
                  <td style={{ padding: "12px 14px" }}>{user.email ?? "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleChange(user.id, event.target.value as RoleValue)}
                      disabled={busyUserId === user.id || user.id === currentUserId}
                    >
                      {Object.entries(roleLabels).map(([role, label]) => (
                        <option key={role} value={role}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {user.id === currentUserId && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: "var(--drive-muted)" }}>(You)</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 14px" }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td
                    style={{
                      padding: "12px 14px",
                      textAlign: "right",
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handlePasswordReset(user.id)}
                      disabled={busyUserId === user.id}
                      className="drive-button-muted"
                    >
                      Set password
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={busyUserId === user.id || user.id === currentUserId}
                      className="drive-button-danger"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
