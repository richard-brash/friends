const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const ALLOWED_ROLES = new Set(["admin", "manager", "volunteer"]);

function loadEnvIfPresent() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function usage() {
  console.log("Usage: npm run role:grant -- <email> <admin|manager|volunteer>");
}

async function main() {
  loadEnvIfPresent();

  const [, , emailArg, roleArg] = process.argv;
  const email = (emailArg || "").trim().toLowerCase();
  const role = (roleArg || "").trim().toLowerCase();

  if (!email || !role) {
    usage();
    process.exitCode = 1;
    return;
  }

  if (!email.includes("@")) {
    console.error("Invalid email.");
    process.exitCode = 1;
    return;
  }

  if (!ALLOWED_ROLES.has(role)) {
    console.error("Invalid role. Choose one of: admin, manager, volunteer.");
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, name: true },
    });

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exitCode = 1;
      return;
    }

    const roleRow = await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
      select: { id: true },
    });

    await prisma.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: user.id,
          role_id: roleRow.id,
        },
      },
      update: {},
      create: {
        user_id: user.id,
        role_id: roleRow.id,
      },
    });

    console.log(`Granted role '${role}' to ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
