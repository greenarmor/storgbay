import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CONSENT_VERSION = "1.0.0";

const RecordConsentSchema = z.object({
  type: z.enum(["privacy_policy", "terms_of_service", "cookie_essential"]),
  version: z.string().optional().default(CONSENT_VERSION),
});

function getClientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  let data: z.infer<typeof RecordConsentSchema>;
  try {
    const json = await request.json();
    data = RecordConsentSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues.at(0);
      return new Response(issue?.message ?? "Invalid request payload.", { status: 400 });
    }
    throw error;
  }

  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? null;

  await prisma.consentRecord.create({
    data: {
      userId: session.user.id,
      type: data.type,
      version: data.version,
      ipAddress,
      userAgent,
    },
  });

  void audit({
    action: `consent.${data.type}.accepted`,
    actorId: session.user.id,
    resource: `user/${session.user.id}`,
    metadata: { version: data.version },
    ipAddress,
  });

  return Response.json({ recorded: true, type: data.type, version: data.version });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const records = await prisma.consentRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      version: true,
      createdAt: true,
    },
  });

  const latestByType: Record<string, (typeof records)[0]> = {};
  for (const record of records) {
    if (!latestByType[record.type]) {
      latestByType[record.type] = record;
    }
  }

  return Response.json({
    consents: latestByType,
    currentVersion: CONSENT_VERSION,
  });
}
