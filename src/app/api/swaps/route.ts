import { toPublic } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authed, body, fail, json, notify } from "@/lib/api";

export const GET = authed(async (_req, user) => {
  const rows = await prisma.swap.findMany({
    where: { OR: [{ requesterId: user.id }, { targetId: user.id }] },
    include: {
      requester: true,
      target: true,
      requesterShift: { include: { template: true } },
      targetShift: { include: { template: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return json({
    swaps: rows.map((s) => ({ ...s, requester: toPublic(s.requester), target: toPublic(s.target) })),
  });
});

/** POST { targetId, requesterShiftId, targetShiftId|null, note } */
export const POST = authed(async (req, user) => {
  const b = await body<{ targetId?: string; requesterShiftId?: string; targetShiftId?: string | null; note?: string }>(req);
  if (!b.targetId || !b.requesterShiftId) return fail("ข้อมูลไม่ครบ");
  const targetId = b.targetId;

  const isFriend = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [{ fromId: user.id, toId: targetId }, { fromId: targetId, toId: user.id }],
    },
  });
  if (!isFriend) return fail("ผู้รับต้องเป็นเพื่อนของคุณ");
  const mine = await prisma.shift.findFirst({ where: { id: b.requesterShiftId, userId: user.id } });
  if (!mine) return fail("ไม่พบเวรของคุณ");
  if (b.targetShiftId && !(await prisma.shift.findFirst({ where: { id: b.targetShiftId, userId: targetId } })))
    return fail("ไม่พบเวรของเพื่อน");
  if (await prisma.swap.findFirst({ where: { status: "pending", requesterShiftId: mine.id } }))
    return fail("เวรนี้มีคำขอแลกที่รออยู่แล้ว");
  if (await prisma.swapPost.findFirst({ where: { status: "open", shiftId: mine.id } }))
    return fail("เวรนี้ถูกประกาศอยู่ในกระดานแลกเวรแล้ว");

  await prisma.$transaction(async (tx) => {
    await tx.swap.create({
      data: {
        requesterId: user.id,
        targetId,
        requesterShiftId: mine.id,
        targetShiftId: b.targetShiftId ?? null,
        note: (b.note ?? "").slice(0, 200),
      },
    });
    await notify(tx, targetId, {
      type: "swap_request",
      title: "คำขอแลกเวร",
      body: `${user.name} ขอ${b.targetShiftId ? "แลก" : "ยกให้"}เวรวันที่ ${mine.date}`,
      link: "/swaps",
    });
  });
  return json({ ok: true }, 201);
});
