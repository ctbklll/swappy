import { prisma } from "@/lib/db";

/** Deployment diagnostics: reports whether env vars are set and whether the database is reachable. No secrets. */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
  };
  let db = "ok";
  try {
    await prisma.user.count();
  } catch (e) {
    const err = e as { code?: string; message?: string };
    db = `${err.code ?? "error"}: ${(err.message ?? "").split("\n").pop()?.replace(/[A-Za-z0-9.-]+\.(com|co|net|io)\b/g, "<host>").slice(0, 160)}`;
  }
  return Response.json({ env, db }, { status: db === "ok" && env.DATABASE_URL && env.AUTH_SECRET ? 200 : 503 });
}
