import { prisma } from "@/lib/db";
import { authed, body, fail, json, notify } from "@/lib/api";
import type { Prisma } from "@/generated/prisma/client";

/** Map a template onto the receiving user's equivalent (same name); clone it for them if none exists. */
async function tplFor(tx: Prisma.TransactionClient, ownerId: string, templateId: string) {
  const src = await tx.shiftTemplate.findUnique({ where: { id: templateId } });
  if (!src || src.userId === ownerId) return templateId;
  const match =
    (await tx.shiftTemplate.findFirst({ where: { userId: ownerId, name: src.name, start: src.start, end: src.end } })) ??
    (await tx.shiftTemplate.findFirst({ where: { userId: ownerId, name: src.name } })) ??
    (await tx.shiftTemplate.create({
      data: { userId: ownerId, name: src.name, start: src.start, end: src.end, color: src.color },
    }));
  return match.id;
}

/** PATCH { action: "accept" | "decline" | "cancel" } */
export const PATCH = authed(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const { action } = await body<{ action?: string }>(req);
  if (!["accept", "decline", "cancel"].includes(action ?? "")) return fail("คำสั่งไม่ถูกต้อง");

  const sw = await prisma.swap.findFirst({ where: { id, status: "pending" } });
  if (!sw) return fail("ไม่พบคำขอ หรือถูกดำเนินการแล้ว", 404);

  if (action === "cancel") {
    if (sw.requesterId !== user.id) return fail("ไม่มีสิทธิ์", 403);
    await prisma.$transaction(async (tx) => {
      await tx.swap.update({ where: { id }, data: { status: "cancelled" } });
      await notify(tx, sw.targetId, {
        type: "swap_result", title: "คำขอแลกเวรถูกยกเลิก", body: `${user.name} ยกเลิกคำขอแลกเวร`, link: "/swaps",
      });
    });
    return json({ ok: true });
  }
  if (sw.targetId !== user.id) return fail("ไม่มีสิทธิ์", 403);

  if (action === "decline") {
    await prisma.$transaction(async (tx) => {
      await tx.swap.update({ where: { id }, data: { status: "declined" } });
      await notify(tx, sw.requesterId, {
        type: "swap_result", title: "คำขอแลกเวรถูกปฏิเสธ", body: `${user.name} ปฏิเสธคำขอแลกเวร`, link: "/swaps",
      });
    });
    return json({ ok: true });
  }

  // accept
  const result = await prisma.$transaction(async (tx) => {
    const a = await tx.shift.findFirst({ where: { id: sw.requesterShiftId, userId: sw.requesterId } });
    const b = sw.targetShiftId
      ? await tx.shift.findFirst({ where: { id: sw.targetShiftId, userId: sw.targetId } })
      : null;
    if (!a || (sw.targetShiftId && !b)) {
      await tx.swap.update({ where: { id }, data: { status: "cancelled" } });
      return "stale" as const;
    }
    const aTpl = await tplFor(tx, sw.targetId, a.templateId);
    const bTpl = b ? await tplFor(tx, sw.requesterId, b.templateId) : null;

    if (b && a.date === b.date) {
      // same day: nobody moves, they just exchange shift types
      await tx.shift.update({ where: { id: a.id }, data: { templateId: bTpl! } });
      await tx.shift.update({ where: { id: b.id }, data: { templateId: aTpl } });
    } else {
      // one shift per user per day: replace whatever the receiver already has on that date
      await tx.shift.deleteMany({ where: { userId: sw.targetId, date: a.date, id: { not: b?.id ?? "" } } });
      if (b) await tx.shift.deleteMany({ where: { userId: sw.requesterId, date: b.date, id: { not: a.id } } });
      await tx.shift.update({ where: { id: a.id }, data: { userId: sw.targetId, templateId: aTpl } });
      if (b) await tx.shift.update({ where: { id: b.id }, data: { userId: sw.requesterId, templateId: bTpl! } });
    }
    await tx.swap.update({ where: { id }, data: { status: "accepted" } });
    await notify(tx, sw.requesterId, {
      type: "swap_result", title: "คำขอแลกเวรได้รับการอนุมัติ", body: `${user.name} ตอบรับการแลกเวรแล้ว`, link: "/",
    });
    return "ok" as const;
  });
  return result === "stale" ? fail("เวรมีการเปลี่ยนแปลง ไม่สามารถแลกได้", 409) : json({ ok: true });
});
