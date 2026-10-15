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

function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null) return "unknown";
  // Initialization errors (bad credentials, unreachable host) carry `errorCode`;
  // known request errors (missing column) carry `code`.
  const record = error as { code?: unknown; errorCode?: unknown };
  return String(record.errorCode ?? record.code ?? "unknown");
}

/** Known request errors carry `code`; connection failures carry `errorCode`, which
 *  Prisma 5 leaves undefined for driver errors, so fall back to the message. */
function classify(error: unknown): string {
  const explicit = errorCode(error);
  if (explicit !== "unknown") return explicit;
  const message = error instanceof Error ? error.message : String(error);
  if (/Authentication failed against database server/i.test(message)) return "P1000";
  if (/database server is running at/i.test(message)) return "P1001";
  if (/Error parsing connection string|invalid port number|database string is invalid/i.test(message)) return "URL";
  return "unknown";
}

let target: { user: string; host: string; port: string; database: string } | null = null;

function reportTarget() {
  console.log("\nDatabase target (parsed from DATABASE_URL):");
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.log("  ✖ DATABASE_URL is not set in this environment");
    return;
  }
  try {
    const url = new URL(raw);
    const password = decodeURIComponent(url.password);
    const masked =
      password.length > 2
        ? `${password[0]}${"*".repeat(password.length - 2)}${password.at(-1)}`
        : "*".repeat(password.length);
    target = {
      user: url.username,
      host: url.hostname,
      port: url.port || "3306",
      database: url.pathname.replace(/^\//, ""),
    };
    console.log(`  user:     ${target.user}`);
    console.log(`  host:     ${target.host}:${target.port}`);
    console.log(`  database: ${target.database}`);
    console.log(`  password: ${password ? `${masked}  (${password.length} chars)` : "(none)"}`);
    console.log("  (URLs are percent-decoded: a literal @ must be written %40, # as %23)");
  } catch (error) {
    console.log(`  ✖ DATABASE_URL cannot be parsed: ${error instanceof Error ? error.message : error}`);
    console.log("  → a raw # or @ in the password breaks parsing; percent-encode it (%23, %40)");
  }
}

function lastLine(message: string): string {
  return (
    message
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? message
  );
}

async function reportConnectivity(): Promise<boolean> {
  console.log("\nConnectivity:");
  try {
    const rows = await prisma.$queryRaw<{ who: string }[]>`SELECT CURRENT_USER() AS who`;
    console.log(`  OK — connected as ${rows[0]?.who ?? "?"}`);
    console.log("  (the matched host needs a GRANT: 'user'@'localhost' does not cover a TCP");
    console.log("   connection to 127.0.0.1 when skip-name-resolve is enabled)");
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = classify(error);
    console.log(`  ✖ FAILS (${code}): ${lastLine(message)}`);
    const user = target?.user ?? "<user>";
    const database = target?.database ?? "<database>";
    const host = target?.host ?? "127.0.0.1";
    if (code === "P1000") {
      console.log("  → MySQL rejected these credentials. Check them without Prisma:");
      console.log(`      mysql -h ${host} -u ${user} -p ${database} -e 'SELECT CURRENT_USER();'`);
      console.log("    Succeeds there? DATABASE_URL holds a different password (quoting,");
      console.log("    percent-encoding, trailing whitespace). Fails there? change both together:");
      console.log(`      ALTER USER '${user}'@'localhost' IDENTIFIED BY '<new-password>';`);
      console.log("    Common trap: URLs are decoded, so each escape must match the real password —");
      console.log("    %23 is #, %40 is @, %25 is %, %2F is /, %2B is +. Cross-check the decoded");
      console.log("    length printed above against the length MySQL actually stores.");
    } else if (code === "P1001") {
      console.log("  → nothing is listening on that host:port — is MySQL running?");
    } else if (code === "URL") {
      console.log("  → percent-encode the password (a literal @ is %40, # is %23, / is %2F)");
    }
    console.log("  (deploy/status need DATABASE_URL only; SHADOW_DATABASE_URL is for 'migrate dev')");
    return false;
  }
}

async function report() {
  reportTarget();
  if (!(await reportConnectivity())) return;

  // An all-columns read mirrors what the app does, so this catches schema drift (a model in
  // schema.prisma that the database lacks). A missing User column surfaces as a bare 401 on
  // login; a missing AuditLog is silent, because `audit()` swallows its own errors.
  console.log("\nSchema check (app's query paths):");
  let schemaOk = true;
  const probes: [string, () => Promise<unknown>][] = [
    ["User", () => prisma.user.findFirst()],
    ["AuditLog", () => prisma.auditLog.findFirst()],
  ];
  for (const [model, probe] of probes) {
    try {
      await probe();
      console.log(`  OK — ${model} present with all columns`);
    } catch (error) {
      schemaOk = false;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  ✖ ${model} FAILS (${classify(error)}): ${lastLine(message)}`);
    }
  }
  if (!schemaOk) {
    console.log("  → a table or column the schema declares is missing; apply migrations:");
    console.log("      npx prisma migrate deploy   (then: npx prisma migrate status)");
    return;
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

  try {
    await prisma.auditLog.create({
      data: {
        action: existing ? "admin.cli.password_reset" : "admin.cli.password_create",
        actorId: null,
        resource: `user/${user.id}`,
        metadata: { email: normalizedEmail, role: user.role, via: "prisma/reset-password.ts" },
      },
    });
  } catch (error) {
    // The password change already committed; do not report the whole command as failed.
    console.log(`\n⚠ AuditLog write failed (${classify(error)}) — the password change itself succeeded.`);
    console.log("  → the AuditLog table is missing: npx prisma migrate deploy");
  }

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
