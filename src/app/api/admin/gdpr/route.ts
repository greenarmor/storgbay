import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const [
    totalUsers,
    totalFiles,
    totalGalleries,
    totalAuditLogs,
    totalConsentRecords,
    recentConsents,
    recentAuditActions,
    usersWithoutConsent,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.file.count(),
    prisma.gallery.count(),
    prisma.auditLog.count(),
    prisma.consentRecord.count(),
    prisma.consentRecord.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        type: true,
        version: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      where: { action: { startsWith: "consent." } },
      select: {
        id: true,
        action: true,
        actorId: true,
        resource: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: {
        consents: { none: { type: "privacy_policy" } },
      },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  const oldestAuditLog = await prisma.auditLog.findFirst({
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const auditRetentionDays = 365;
  const auditCutoff = oldestAuditLog
    ? Math.max(0, Math.ceil((Date.now() - oldestAuditLog.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return Response.json({
    summary: {
      totalUsers,
      totalFiles,
      totalGalleries,
      totalAuditLogs,
      totalConsentRecords,
      usersWithoutConsentCount: usersWithoutConsent.length,
      auditRetentionDays,
      oldestAuditDate: oldestAuditLog?.createdAt ?? null,
    },
    usersWithoutConsent,
    recentConsents,
    recentAuditActions,
  });
}
