import { prisma } from "@/lib/db";
import { authed, body, fail, json, notify } from "@/lib/api";

/** PATCH { action: "accept" | "decline" } — respond to an incoming request. */
export const PATCH = authed(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const { action } = await body<{ action?: string }>(req);
  if (action !== "accept" && action !== "decline") return fail("คำสั่งไม่ถูกต้อง");
  const f = await prisma.friendship.findFirst({ where: { id, toId: user.id, status: "pending" } });
  if (!f) return fail("ไม่พบคำขอ", 404);
  await prisma.$transaction(async (tx) => {
    await tx.friendship.update({ where: { id }, data: { status: action === "accept" ? "accepted" : "declined" } });
    if (action === "accept")
      await notify(tx, f.fromId, {
        type: "friend_accepted",
        title: "คำขอเป็นเพื่อนได้รับการตอบรับ",
        body: `${user.name} ตอบรับคำขอเป็นเพื่อนของคุณแล้ว`,
        link: "/friends",
      });
  });
  return json({ ok: true });
});

/** DELETE — unfriend, or cancel an outgoing request. */
export const DELETE = authed(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const { count } = await prisma.friendship.deleteMany({
    where: { id, OR: [{ fromId: user.id }, { toId: user.id }] },
  });
  return count ? json({ ok: true }) : fail("ไม่พบรายการ", 404);
});
