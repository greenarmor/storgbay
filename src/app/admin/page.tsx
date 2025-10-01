import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminFileManager } from "@/components/AdminFileManager";
import { UserManagement } from "@/components/UserManagement";
import type { Role } from "@prisma/client";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const adminUsers: AdminUser[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <header>
        <h1 style={{ marginBottom: 4 }}>Admin Console</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Manage members, assign permissions, and keep your workspace organized.
        </p>
      </header>
      <UserManagement initialUsers={adminUsers} currentUserId={session.user.id} />
      <AdminFileManager />
    </div>
  );
}
