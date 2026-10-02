import { prisma } from "@/lib/db";
import { authed, body, fail, isColor, isTime, json } from "@/lib/api";

export const PUT = authed(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const b = await body<{ name?: string; start?: string; end?: string; color?: string }>(req);
  if (b.start !== undefined && !isTime(b.start)) return fail("เวลาไม่ถูกต้อง");
  if (b.end !== undefined && !isTime(b.end)) return fail("เวลาไม่ถูกต้อง");
  if (b.color !== undefined && !isColor(b.color)) return fail("สีไม่ถูกต้อง");
  const { count } = await prisma.shiftTemplate.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(b.name?.trim() ? { name: b.name.trim().slice(0, 30) } : {}),
      ...(b.start ? { start: b.start } : {}),
      ...(b.end ? { end: b.end } : {}),
      ...(b.color ? { color: b.color } : {}),
    },
  });
  if (!count) return fail("ไม่พบกะงาน", 404);
  return json({ template: await prisma.shiftTemplate.findUnique({ where: { id } }) });
});

export const DELETE = authed(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const { count } = await prisma.shiftTemplate.deleteMany({ where: { id, userId: user.id } }); // shifts cascade
  return count ? json({ ok: true }) : fail("ไม่พบกะงาน", 404);
});
