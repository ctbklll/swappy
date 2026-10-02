import { toPublic } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authed, body, fail, json, notify } from "@/lib/api";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

async function friendIds(userId: string) {
  const rows = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ fromId: userId }, { toId: userId }] },
    select: { fromId: true, toId: true },
  });
  return rows.map((r) => (r.fromId === userId ? r.toId : r.fromId));
}

/** GET — `board`: open posts from my friends; `mine`: my own posts with the people who showed interest. */
export const GET = authed(async (_req, user) => {
  const ids = await friendIds(user.id);
  const t = today();
  const withTpl = { include: { template: true } } as const;

  const [board, mine] = await Promise.all([
    prisma.swapPost.findMany({
      where: { status: "open", posterId: { in: ids }, shift: { date: { gte: t } } },
      include: { poster: true, shift: withTpl, interests: { where: { userId: user.id } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.swapPost.findMany({
      where: { posterId: user.id },
      include: { shift: withTpl, interests: { include: { user: true, shift: withTpl }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return json({
    board: board.map(({ interests, poster, ...p }) => ({
      ...p, poster: toPublic(poster), myInterest: interests[0] ?? null,
    })),
    mine: mine.map((p) => ({
      ...p, interests: p.interests.map(({ user: u, ...i }) => ({ ...i, user: toPublic(u) })),
    })),
  });
});

/** POST { shiftId, note?, allowGiveaway? } — announce one of my shifts for swapping. */
export const POST = authed(async (req, user) => {
  const b = await body<{ shiftId?: string; note?: string; allowGiveaway?: boolean }>(req);
  if (!b.shiftId) return fail("ข้อมูลไม่ครบ");
  const shift = await prisma.shift.findFirst({ where: { id: b.shiftId, userId: user.id } });
  if (!shift) return fail("ไม่พบเวรของคุณ");
  if (shift.date < today()) return fail("ไม่สามารถประกาศเวรที่ผ่านมาแล้ว");
  if (await prisma.swapPost.findFirst({ where: { shiftId: shift.id, status: "open" } })) return fail("เวรนี้ถูกประกาศอยู่แล้ว");
  if (await prisma.swap.findFirst({ where: { requesterShiftId: shift.id, status: "pending" } })) return fail("เวรนี้มีคำขอแลกที่รออยู่แล้ว");

  const ids = await friendIds(user.id);
  await prisma.$transaction(async (tx) => {
    await tx.swapPost.create({
      data: { posterId: user.id, shiftId: shift.id, note: (b.note ?? "").slice(0, 200), allowGiveaway: !!b.allowGiveaway },
    });
    for (const fid of ids) {
      await notify(tx, fid, {
        type: "swap_post", title: "ประกาศแลกเวรใหม่", body: `${user.name} ประกาศแลกเวรวันที่ ${shift.date}`, link: "/swaps",
      });
    }
  });
  return json({ ok: true }, 201);
});
