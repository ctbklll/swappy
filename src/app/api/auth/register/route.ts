import { createSession, toPublic } from "@/lib/auth";
import { DEFAULT_TEMPLATES, hashPassword, personalCode, prisma } from "@/lib/db";
import { body, fail, json } from "@/lib/api";

export async function POST(req: Request) {
  const { name, email, password, confirm } = await body<{ name?: string; email?: string; password?: string; confirm?: string }>(req);
  if (!name?.trim() || !email?.trim() || !password) return fail("กรอกข้อมูลให้ครบ");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("รูปแบบอีเมลไม่ถูกต้อง");
  if (password !== confirm) return fail("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
  if (password.length < 6) return fail("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");

  const lower = email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: lower } })) return fail("อีเมลนี้ถูกใช้งานแล้ว", 409);

  const first = (await prisma.user.count()) === 0;
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: lower,
      passwordHash: hashPassword(password),
      role: first ? "admin" : "user",
      code: personalCode(),
      templates: { create: DEFAULT_TEMPLATES },
    },
  });
  await createSession(user.id);
  return json({ user: toPublic(user) });
}
