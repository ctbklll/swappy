import { prisma } from "@/lib/db";
import { authed, body, fail, json, notify } from "@/lib/api";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** POST { shiftId?: string|null, note? } — "I'm interested": offer one of my shifts (or just take it, if allowed). */
export const POST = authed(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const b = await body<{ shiftId?: string | null; note?: string }>(req);

  const post = await prisma.swapPost.findFirst({ where: { id, status: "open" }, include: { shift: true } });
  if (!post) return fail("ไม่พบประกาศ หรือถูกปิดแล้ว", 404);
  if (post.posterId === user.id) return fail("ไม่สามารถสนใจประกาศของตัวเองได้");
  const friend = await prisma.friendship.findFirst({
    where: { status: "accepted", OR: [{ fromId: user.id, toId: post.posterId }, { fromId: post.posterId, toId: user.id }] },
  });
  if (!friend) return fail("ประกาศนี้เปิดให้เฉพาะเพื่อนของผู้ประกาศ", 403);
  if (post.shift.date < today()) return fail("เวรนี้ผ่านมาแล้ว");

  let shiftId: string | null = null;
  if (b.shiftId) {
    const mine = await prisma.shift.findFirst({ where: { id: b.shiftId, userId: user.id } });
    if (!mine) return fail("ไม่พบเวรของคุณ");
    if (mine.date < today()) return fail("ไม่สามารถใช้เวรที่ผ่านมาแล้ว");
    shiftId = mine.id;
  } else if (!post.allowGiveaway) {
    return fail("ผู้ประกาศต้องการให้เสนอเวรของคุณเพื่อแลก");
  }

  const note = (b.note ?? "").slice(0, 200);
  await prisma.$transaction(async (tx) => {
    await tx.swapInterest.upsert({
      where: { postId_userId: { postId: id, userId: user.id } },
      create: { postId: id, userId: user.id, shiftId, note },
      update: { shiftId, note, status: "pending" },
    });
    await notify(tx, post.posterId, {
      type: "swap_post", title: "มีคนสนใจแลกเวรของคุณ", body: `${user.name} สนใจแลกเวรวันที่ ${post.shift.date}`, link: "/swaps",
    });
  });
  return json({ ok: true }, 201);
});

/** DELETE — withdraw my interest. */
export const DELETE = authed(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const { count } = await prisma.swapInterest.deleteMany({ where: { postId: id, userId: user.id, status: "pending" } });
  return count ? json({ ok: true }) : fail("ไม่พบรายการ", 404);
});
