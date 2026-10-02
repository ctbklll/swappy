import { prisma } from "@/lib/db";
import { authed, body, fail, isColor, isTime, json } from "@/lib/api";

export const GET = authed(async (_req, user) => {
  const templates = await prisma.shiftTemplate.findMany({ where: { userId: user.id }, orderBy: { start: "asc" } });
  return json({ templates });
});

export const POST = authed(async (req, user) => {
  const b = await body<{ name?: string; start?: string; end?: string; color?: string }>(req);
  if (!b.name?.trim()) return fail("กรอกชื่อกะ");
  if (!isTime(b.start) || !isTime(b.end)) return fail("เวลาไม่ถูกต้อง");
  if (!isColor(b.color)) return fail("สีไม่ถูกต้อง");
  const template = await prisma.shiftTemplate.create({
    data: { userId: user.id, name: b.name.trim().slice(0, 30), start: b.start, end: b.end, color: b.color },
  });
  return json({ template }, 201);
});
