import { prisma } from "@/lib/db";

const AUDIT_RETENTION_DAYS = 365;
const EXPIRED_SHARE_RETENTION_DAYS = 30;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return new Response("CRON_SECRET is not configured.", { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const auditCutoff = new Date(now.getTime() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const shareCutoff = new Date(now.getTime() - EXPIRED_SHARE_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const [auditResult, shareResult] = await Promise.all([
    prisma.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } }),
    prisma.shareLink.deleteMany({ where: { expiresAt: { not: null, lt: shareCutoff } } }),
  ]);

  return Response.json({
    auditLogsDeleted: auditResult.count,
    expiredSharesDeleted: shareResult.count,
    cutoffDate: auditCutoff.toISOString(),
  });
}
