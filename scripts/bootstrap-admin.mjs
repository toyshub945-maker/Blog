// Creates the first admin account on container start, from env vars.
// Idempotent: if the user already exists, nothing changes (so changing the
// password env later does NOT reset a live account — do that in the app).
//
// Plain .mjs (no TypeScript/tsx) so it runs in the slim production image.
import prismaPkg from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

const email = (process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD || "";
const name = process.env.INITIAL_ADMIN_NAME || "Editor";

async function main() {
  if (!email || !password) {
    console.log("[bootstrap-admin] INITIAL_ADMIN_EMAIL/PASSWORD not set — skipping.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[bootstrap-admin] admin already exists (${email}) — no change.`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name,
      password: await bcrypt.hash(password, 10),
      role: "admin",
    },
  });
  console.log(`[bootstrap-admin] created admin ${email}`);
}

main()
  .catch((e) => {
    console.error("[bootstrap-admin] failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
