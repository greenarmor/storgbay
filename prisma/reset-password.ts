import { existsSync } from "node:fs";
import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROLES: readonly Role[] = ["USER", "UPLOADER", "ADMIN"];
const MIN_PASSWORD_LENGTH = 8;

function usage(message?: string): never {
  if (message) console.error(`\n✖ ${message}\n`);
  console.log(
    [
      "Usage: pnpm db:reset-password <email> <new-password> [--create] [--role ADMIN|UPLOADER|USER]",
      "       pnpm db:reset-password --list",
      "",
      "  Resets the password for an existing account.",
      "  --list     list accounts, bootstrap-override status, and recent login failures",
      "  --create   create the account if it does not exist (defaults to the ADMIN role)",
      "  --role     also set the account role",
      "",
      "Notes:",
      "  • If <email> is BOOTSTRAP_ADMIN_EMAIL, the app overwrites this password on the",
      "    next login with BOOTSTRAP_ADMIN_PASSWORD from .env — change that too.",
      "  • This does NOT revoke existing sessions (sessions are JWT-based).",
    ].join("\n"),
  );
  process.exit(1);
}

async function report() {
  // An all-columns read mirrors what the app's `findUnique`/`upsert` does, so this
  // catches schema drift (e.g. a column in schema.prisma that the DB lacks), which
  // makes the bootstrap login throw and surface as a bare 401.
  console.log("\nSchema check (app's login query path):");
  try {
    await prisma.user.findFirst();
    console.log("  OK — all User columns present");
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "unknown";
    console.log(`  ✖ FAILS (${code}): ${error instanceof Error ? error.message.split("\n")[0] : error}`);
    console.log("  → run: npx prisma migrate deploy   (or: npx prisma migrate status)");
  }

  console.log("\nEnv files in this directory:");
  for (const file of [".env", ".env.local", ".env.production", ".env.production.local"]) {
    console.log(`  ${existsSync(file) ? "present" : "absent "}  ${file}`);
  }
  console.log("  (Next.js precedence: .env.production.local > .env.local > .env.production > .env)");

  const users = await prisma.user.findMany({
    select: { email: true, role: true, passwordHash: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nAccounts (${users.length}):`);
  if (users.length === 0) console.log("  (none)");
  for (const user of users) {
    console.log(
      `  • ${user.email ?? "(no email)"}  [${user.role}]  password:${user.passwordHash ? "set" : "NONE"}  since:${user.createdAt.toISOString().slice(0, 10)}`,
    );
  }

  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  console.log("\nBootstrap override:");
  if (bootstrapEmail && bootstrapPassword) {
    const match = users.find((user) => user.email === bootstrapEmail);
    console.log(`  ENABLED for ${bootstrapEmail}`);
    console.log(`  → that email's password is always BOOTSTRAP_ADMIN_PASSWORD`);
    console.log(`  → account exists: ${match ? "yes" : "no (created on first login)"}`);
  } else {
    console.log("  DISABLED — BOOTSTRAP_ADMIN_EMAIL/PASSWORD not both set in this env");
  }

  const attempts = await prisma.auditLog.findMany({
    where: { action: { startsWith: "auth.login" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { action: true, metadata: true, createdAt: true },
  });
  console.log("\nRecent login attempts (reason is only visible here):");
  if (attempts.length === 0) console.log("  (none)");
  for (const attempt of attempts) {
    console.log(`  ${attempt.createdAt.toISOString()}  ${attempt.action}  ${JSON.stringify(attempt.metadata)}`);
  }
  console.log();
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--list")) {
    await report();
    return;
  }

  const create = argv.includes("--create");
  const roleFlagIndex = argv.indexOf("--role");
  if (roleFlagIndex !== -1 && !argv[roleFlagIndex + 1]) {
    usage("--role requires a value.");
  }
  const role = roleFlagIndex !== -1 ? (argv[roleFlagIndex + 1] as Role) : undefined;
  if (role && !ROLES.includes(role)) {
    usage(`Invalid role "${role}". Expected one of: ${ROLES.join(", ")}.`);
  }

  const positional = argv.filter(
    (arg, index) =>
      !arg.startsWith("--") && !(roleFlagIndex !== -1 && index === roleFlagIndex + 1),
  );
  const [email, password] = positional;

  if (!email || !password) usage("Both <email> and <new-password> are required.");
  if (!email.includes("@")) usage(`"${email}" does not look like an email address.`);
  if (password.length < MIN_PASSWORD_LENGTH) {
    usage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!existing && !create) {
    const users = await prisma.user.findMany({
      select: { email: true, role: true },
      orderBy: { createdAt: "asc" },
    });
    console.error(`\n✖ No account found for "${normalizedEmail}".`);
    console.error("  Existing accounts:");
    for (const user of users) {
      console.error(`    • ${user.email ?? "(no email)"}  [${user.role}]`);
    }
    console.error("\n  Re-run with --create to create this account instead.\n");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, ...(role ? { role } : {}) },
      })
    : await prisma.user.create({
        data: { email: normalizedEmail, passwordHash, role: role ?? "ADMIN", name: "Admin" },
      });

  await prisma.auditLog.create({
    data: {
      action: existing ? "admin.cli.password_reset" : "admin.cli.password_create",
      actorId: null,
      resource: `user/${user.id}`,
      metadata: { email: normalizedEmail, role: user.role, via: "prisma/reset-password.ts" },
    },
  });

  console.log(`\n✔ ${existing ? "Password reset" : "Account created"} for ${normalizedEmail} [${user.role}]`);

  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (bootstrapEmail && bootstrapEmail === normalizedEmail) {
    console.log(
      "⚠ This email is BOOTSTRAP_ADMIN_EMAIL — BOOTSTRAP_ADMIN_PASSWORD in .env will\n" +
        "  overwrite this password on the next login. Update .env to keep them in sync.",
    );
  }
  console.log("⚠ Existing sessions are not revoked. Restart the app and re-login.\n");
}

main()
  .catch((error) => {
    console.error("\n✖ Failed to reset password:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
