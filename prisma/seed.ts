import { config } from "dotenv";
import { randomBytes, scryptSync } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });
config();

const url = new URL(process.env.DIRECT_URL ?? process.env.DATABASE_URL!);
url.searchParams.delete("pgbouncer");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } }),
});

const hash = (pw: string) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
};
const pad = (n: number) => String(n).padStart(2, "0");

const DEMO = [
  { name: "ผู้ดูแลระบบ", email: "admin@swappy.app", role: "admin" as const, code: "SW-ADMIN001" },
  { name: "สมชาย ใจดี", email: "somchai@swappy.app", role: "user" as const, code: "SW-SOMCHAI1" },
  { name: "มานี มีสุข", email: "manee@swappy.app", role: "user" as const, code: "SW-MANEE002" },
  { name: "ปิติ วงศ์ไทย", email: "piti@swappy.app", role: "user" as const, code: "SW-PITI0003" },
];
const TEMPLATES = [
  { name: "เช้า", start: "08:00", end: "16:00", color: "#2563eb" },
  { name: "บ่าย", start: "16:00", end: "00:00", color: "#f59e0b" },
  { name: "ดึก", start: "00:00", end: "08:00", color: "#7c3aed" },
];

async function main() {
  if ((await prisma.user.count()) > 0) {
    console.log("Database already has users — skipping seed.");
    return;
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const users = [];
  for (const [i, d] of DEMO.entries()) {
    const u = await prisma.user.create({
      data: { ...d, passwordHash: hash("password123"), templates: { create: TEMPLATES } },
      include: { templates: true },
    });
    users.push(u);
    if (i === 0) continue;
    const days = new Date(y, m + 1, 0).getDate();
    const data = [];
    for (let day = 1; day <= days; day++) {
      if ((day + i - 1) % 4 === 3) continue; // day off
      const tpl = TEMPLATES[(day + i - 1) % 3];
      data.push({
        userId: u.id,
        date: `${y}-${pad(m + 1)}-${pad(day)}`,
        templateId: u.templates.find((t) => t.name === tpl.name)!.id,
      });
    }
    await prisma.shift.createMany({ data });
  }
  await prisma.friendship.create({ data: { fromId: users[1].id, toId: users[2].id, status: "accepted" } });
  await prisma.friendship.create({ data: { fromId: users[3].id, toId: users[1].id } });
  await prisma.notification.create({
    data: {
      userId: users[1].id, type: "friend_request", title: "คำขอเป็นเพื่อนใหม่",
      body: "ปิติ วงศ์ไทย ต้องการเป็นเพื่อนกับคุณ", link: "/friends",
    },
  });
  console.log("Seeded demo data (password: password123)");
}

main().finally(() => prisma.$disconnect());
