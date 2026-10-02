import { prisma } from "@/lib/db";
import { executeSwap } from "@/lib/swap";
import { authed, body, fail, json, notify } from "@/lib/api";

/** POST { interestId } — the poster picks one interested person; the swap is carried out immediately. */
export const POST = authed(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const { interestId } = await body<{ interestId?: string }>(req);
  if (!interestId) return fail("ข้อมูลไม่ครบ");

  const post = await prisma.swapPost.findFirst({
    where: { id, posterId: user.id, status: "open" },
    include: { shift: true, interests: { where: { status: "pending" } } },
  });
  if (!post) return fail("ไม่พบประกาศ หรือถูกปิดแล้ว", 404);
  const chosen = post.interests.find((i) => i.id === interestId);
  if (!chosen) return fail("ไม่พบผู้สนใจคนนี้", 404);

  const result = await prisma.$transaction(async (tx) => {
    const ok = await executeSwap(tx, post.shiftId, user.id, chosen.shiftId, chosen.userId);
    if (!ok) {
      // one of the shifts changed: drop that offer, keep the post open for the others
      await tx.swapInterest.update({ where: { id: chosen.id }, data: { status: "rejected" } });
      return false;
    }
    await tx.swapPost.update({ where: { id }, data: { status: "matched" } });
    await tx.swapInterest.update({ where: { id: chosen.id }, data: { status: "chosen" } });
    await tx.swapInterest.updateMany({ where: { postId: id, status: "pending" }, data: { status: "rejected" } });
    await notify(tx, chosen.userId, {
      type: "swap_post", title: "คุณได้รับเลือกให้แลกเวร", body: `${user.name} เลือกคุณแลกเวรวันที่ ${post.shift.date}`, link: "/",
    });
    for (const o of post.interests) {
      if (o.id === chosen.id) continue;
      await notify(tx, o.userId, {
        type: "swap_post", title: "ประกาศแลกเวรปิดแล้ว", body: `${user.name} เลือกคนอื่นสำหรับเวรวันที่ ${post.shift.date}`, link: "/swaps",
      });
    }
    return true;
  });
  return result ? json({ ok: true }) : fail("เวรมีการเปลี่ยนแปลง ไม่สามารถแลกได้", 409);
});
