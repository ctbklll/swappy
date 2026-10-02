import { toPublic } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authed, json } from "@/lib/api";

export const GET = authed(async () => {
  const [users, shifts, templates, swapsPending, swapsAccepted, friendships] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { shifts: true } } } }),
    prisma.shift.count(),
    prisma.shiftTemplate.count(),
    prisma.swap.count({ where: { status: "pending" } }),
    prisma.swap.count({ where: { status: "accepted" } }),
    prisma.friendship.count({ where: { status: "accepted" } }),
  ]);
  return json({
    users: users.map((u) => ({ ...toPublic(u), shiftCount: u._count.shifts })),
    stats: { users: users.length, shifts, templates, swapsPending, swapsAccepted, friendships },
  });
}, { admin: true });
