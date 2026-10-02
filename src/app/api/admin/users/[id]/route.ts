import { prisma } from "@/lib/db";
import { authed, body, fail, json } from "@/lib/api";

export const PATCH = authed(async (req, me, ctx) => {
  const { id } = await ctx.params;
  const { role } = await body<{ role?: string }>(req);
  if (role !== "user" && role !== "admin") return fail("สิทธิ์ไม่ถูกต้อง");
  if (id === me.id) return fail("ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้");
  const { count } = await prisma.user.updateMany({ where: { id }, data: { role } });
  return count ? json({ ok: true }) : fail("ไม่พบผู้ใช้", 404);
}, { admin: true });

export const DELETE = authed(async (_req, me, ctx) => {
  const { id } = await ctx.params;
  if (id === me.id) return fail("ไม่สามารถลบตัวเองได้");
  const { count } = await prisma.user.deleteMany({ where: { id } }); // everything else cascades
  return count ? json({ ok: true }) : fail("ไม่พบผู้ใช้", 404);
}, { admin: true });
