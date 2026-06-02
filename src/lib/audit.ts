import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  action: string;
  actorId?: string | null;
  resource?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
};

export async function audit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId ?? null,
        resource: input.resource ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log write failed:", error);
  }
}
