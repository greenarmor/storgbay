import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  action: string;
  actorId?: string | null;
  resource?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  request?: Request | null;
};

function extractIp(input: AuditInput): string | null {
  if (input.ipAddress) return input.ipAddress;
  if (!input.request) return null;
  return (
    input.request.headers.get("x-client-ip") ??
    input.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    input.request.headers.get("x-real-ip") ??
    null
  );
}

export async function audit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId ?? null,
        resource: input.resource ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress: extractIp(input),
      },
    });
  } catch (error) {
    console.error("Audit log write failed:", error);
  }
}
