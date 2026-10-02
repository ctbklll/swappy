import { createSession, sessionToken, toPublic, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { body, fail, json } from "@/lib/api";

export async function POST(req: Request) {
  const { email, password } = await body<{ email?: string; password?: string }>(req);
  if (!email || !password) return fail("กรอกอีเมลและรหัสผ่าน");
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !verifyPassword(password, user.passwordHash)) return fail("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
  await createSession(user.id);
  return json({ user: toPublic(user), token: sessionToken(user.id) });
}
