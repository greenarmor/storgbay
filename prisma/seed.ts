import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL!.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD!;
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: "ADMIN", name: "Admin" },
    update: { passwordHash, role: "ADMIN", name: "Admin" },
  });

  console.log("✔ Seeded admin:", email);
}

main().finally(() => prisma.$disconnect());
