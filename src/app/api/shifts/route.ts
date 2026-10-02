import { prisma } from "@/lib/db";
import { authed, body, fail, isDate, json } from "@/lib/api";

/** GET /api/shifts?from=&to=&userId=  — own shifts, or a friend's. */
export const GET = authed(async (req, user) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? "0000-00-00";
  const to = url.searchParams.get("to") ?? "9999-99-99";
  const userId = url.searchParams.get("userId") ?? user.id;
  if (userId !== user.id && user.role !== "admin") {
    const friends = await prisma.friendship.findFirst({
      where: {
        status: "accepted",
        OR: [{ fromId: user.id, toId: userId }, { fromId: userId, toId: user.id }],
      },
    });
    if (!friends) return fail("ไม่ใช่เพื่อนของคุณ", 403);
  }
  const [shifts, templates] = await Promise.all([
    prisma.shift.findMany({ where: { userId, date: { gte: from, lte: to } }, orderBy: { date: "asc" } }),
    prisma.shiftTemplate.findMany({ where: { userId } }),
  ]);
  return json({ shifts, templates });
});

/** POST { dates: string[], templateId } — assign a shift to one or more dates (replaces existing). */
export const POST = authed(async (req, user) => {
  const b = await body<{ dates?: string[]; templateId?: string }>(req);
  if (!Array.isArray(b.dates) || !b.dates.length || !b.dates.every(isDate)) return fail("วันที่ไม่ถูกต้อง");
  if (b.dates.length > 62) return fail("เลือกได้ไม่เกิน 62 วัน");
  const tpl = await prisma.shiftTemplate.findFirst({ where: { id: b.templateId, userId: user.id } });
  if (!tpl) return fail("ไม่พบกะงาน", 404);
  const dates = [...new Set(b.dates)];
  await prisma.$transaction([
    prisma.shift.deleteMany({ where: { userId: user.id, date: { in: dates } } }),
    prisma.shift.createMany({ data: dates.map((date) => ({ userId: user.id, date, templateId: tpl.id })) }),
  ]);
  return json({ ok: true, count: dates.length }, 201);
});

/** DELETE { dates: string[] } — clear own shifts on dates. */
export const DELETE = authed(async (req, user) => {
  const b = await body<{ dates?: string[] }>(req);
  if (!Array.isArray(b.dates) || !b.dates.every(isDate)) return fail("วันที่ไม่ถูกต้อง");
  await prisma.shift.deleteMany({ where: { userId: user.id, date: { in: b.dates } } });
  return json({ ok: true });
});
