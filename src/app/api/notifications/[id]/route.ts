import { prisma } from "@/lib/db";
import { authed, json } from "@/lib/api";

export const PATCH = authed(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  return json({ ok: true });
});
