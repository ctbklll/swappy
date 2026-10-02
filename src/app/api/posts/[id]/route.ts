import { prisma } from "@/lib/db";
import { authed, fail, json, notify } from "@/lib/api";

/** DELETE — the poster cancels an open announcement; people who showed interest are told. */
export const DELETE = authed(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const post = await prisma.swapPost.findFirst({
    where: { id, posterId: user.id, status: "open" },
    include: { shift: true, interests: { where: { status: "pending" } } },
  });
  if (!post) return fail("ไม่พบประกาศ หรือถูกปิดแล้ว", 404);
  await prisma.$transaction(async (tx) => {
    await tx.swapPost.update({ where: { id }, data: { status: "cancelled" } });
    await tx.swapInterest.updateMany({ where: { postId: id, status: "pending" }, data: { status: "rejected" } });
    for (const i of post.interests) {
      await notify(tx, i.userId, {
        type: "swap_post", title: "ประกาศแลกเวรถูกยกเลิก", body: `${user.name} ยกเลิกประกาศแลกเวรวันที่ ${post.shift.date}`, link: "/swaps",
      });
    }
  });
  return json({ ok: true });
});
