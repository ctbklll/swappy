import { toPublic, verifyPassword } from "@/lib/auth";
import { hashPassword, prisma } from "@/lib/db";
import { authed, body, fail, json } from "@/lib/api";
import type { TagStyle } from "@/generated/prisma/client";

export const GET = authed(async (_req, user) => json({ user: toPublic(user) }));

const STYLES: TagStyle[] = ["bar", "dot", "block", "letter"];

export const PATCH = authed(async (req, me) => {
  const b = await body<{
    name?: string; email?: string; avatar?: string | null; tagStyle?: TagStyle;
    currentPassword?: string; newPassword?: string;
  }>(req);

  if (b.avatar && (!/^data:image\/(png|jpe?g|webp);base64,/.test(b.avatar) || b.avatar.length > 700_000))
    return fail("รูปโปรไฟล์ไม่ถูกต้องหรือมีขนาดใหญ่เกินไป");
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) return fail("รูปแบบอีเมลไม่ถูกต้อง");
  if (b.tagStyle && !STYLES.includes(b.tagStyle)) return fail("รูปแบบแท็กไม่ถูกต้อง");
  if (b.newPassword) {
    if (b.newPassword.length < 6) return fail("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
    if (!b.currentPassword || !verifyPassword(b.currentPassword, me.passwordHash)) return fail("รหัสผ่านปัจจุบันไม่ถูกต้อง");
  }
  const email = b.email?.trim().toLowerCase();
  if (email && email !== me.email && (await prisma.user.findUnique({ where: { email } })))
    return fail("อีเมลนี้ถูกใช้งานแล้ว", 409);

  const u = await prisma.user.update({
    where: { id: me.id },
    data: {
      ...(b.name?.trim() ? { name: b.name.trim() } : {}),
      ...(email ? { email } : {}),
      ...(b.avatar !== undefined ? { avatar: b.avatar } : {}),
      ...(b.tagStyle ? { tagStyle: b.tagStyle } : {}),
      ...(b.newPassword ? { passwordHash: hashPassword(b.newPassword) } : {}),
    },
  });
  return json({ user: toPublic(u) });
});
