import { prisma } from "@/lib/db";
import { authed, fail, json } from "@/lib/api";

/** DELETE — the author or an admin can remove a review. */
export const DELETE = authed(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const { count } = await prisma.review.deleteMany({
    where: { id, ...(user.role === "admin" ? {} : { userId: user.id }) },
  });
  return count ? json({ ok: true }) : fail("ไม่พบรายการ", 404);
});
