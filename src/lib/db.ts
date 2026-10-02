import "server-only";
import { randomBytes, scryptSync } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Supabase Postgres via Prisma. DATABASE_URL should be the transaction-mode pooler
 * (port 6543). Migrations use DIRECT_URL (see prisma.config.ts).
 */
function create() {
  const url = new URL(process.env.DATABASE_URL ?? "postgresql://invalid");
  url.searchParams.delete("pgbouncer"); // Prisma-only flag; the pg driver doesn't understand it
  const adapter = new PrismaPg({
    connectionString: url.toString(),
    ssl: url.hostname.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });
  return new PrismaClient({ adapter });
}

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? create();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

export const personalCode = () => "SW-" + randomBytes(4).toString("hex").toUpperCase();

export const DEFAULT_TEMPLATES = [
  { name: "เช้า", start: "08:00", end: "16:00", color: "#2563eb" },
  { name: "บ่าย", start: "16:00", end: "00:00", color: "#f59e0b" },
  { name: "ดึก", start: "00:00", end: "08:00", color: "#7c3aed" },
];
