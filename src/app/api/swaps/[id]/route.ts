import { prisma } from "@/lib/db";
import { executeSwap } from "@/lib/swap";
import { authed, body, fail, json, notify } from "@/lib/api";

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
  const done = await prisma.$transaction(async (tx) => {
    const ok = await executeSwap(tx, sw.requesterShiftId, sw.requesterId, sw.targetShiftId, sw.targetId);
    if (!ok) {
      await tx.swap.update({ where: { id }, data: { status: "cancelled" } });
      return false;
    }
    await tx.swap.update({ where: { id }, data: { status: "accepted" } });
    await notify(tx, sw.requesterId, {
      type: "swap_result", title: "คำขอแลกเวรได้รับการอนุมัติ", body: `${user.name} ตอบรับการแลกเวรแล้ว`, link: "/",
    });
    return true;
  });
  return done ? json({ ok: true }) : fail("เวรมีการเปลี่ยนแปลง ไม่สามารถแลกได้", 409);
});
