import { toPublic } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authed, body, fail, json, notify } from "@/lib/api";

export const GET = authed(async (_req, user) => {
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ fromId: user.id }, { toId: user.id }], status: { in: ["pending", "accepted"] } },
    include: { from: true, to: true },
    orderBy: { createdAt: "desc" },
  });
  const entry = (f: (typeof rows)[number]) => ({
    friendshipId: f.id,
    user: toPublic(f.fromId === user.id ? f.to : f.from),
    createdAt: f.createdAt,
  });
  return json({
    friends: rows.filter((f) => f.status === "accepted").map(entry),
    incoming: rows.filter((f) => f.status === "pending" && f.toId === user.id).map(entry),
    outgoing: rows.filter((f) => f.status === "pending" && f.fromId === user.id).map(entry),
    myCode: user.code,
  });
});

/** POST { code } — send a friend request using someone's personal code. */
export const POST = authed(async (req, user) => {
  const { code } = await body<{ code?: string }>(req);
  const c = code?.trim().toUpperCase().replace(/^SWAPPY:/, "");
  if (!c) return fail("กรอกรหัสส่วนตัว");
  const target = await prisma.user.findUnique({ where: { code: c } });
  if (!target) return fail("ไม่พบผู้ใช้จากรหัสนี้", 404);
  if (target.id === user.id) return fail("ไม่สามารถเพิ่มตัวเองเป็นเพื่อนได้");

  const existing = await prisma.friendship.findFirst({
    where: { OR: [{ fromId: user.id, toId: target.id }, { fromId: target.id, toId: user.id }] },
  });
  if (existing?.status === "accepted") return fail("เป็นเพื่อนกันอยู่แล้ว", 409);
  if (existing?.status === "pending") return fail("มีคำขอที่รออยู่แล้ว", 409);

  await prisma.$transaction(async (tx) => {
    if (existing) await tx.friendship.delete({ where: { id: existing.id } }); // re-request after decline
    await tx.friendship.create({ data: { fromId: user.id, toId: target.id } });
    await notify(tx, target.id, {
      type: "friend_request",
      title: "คำขอเป็นเพื่อนใหม่",
      body: `${user.name} ต้องการเป็นเพื่อนกับคุณ`,
      link: "/friends",
    });
  });
  return json({ ok: true, name: target.name }, 201);
});
