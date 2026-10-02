import { prisma } from "@/lib/db";
import { authed, json } from "@/lib/api";

export const GET = authed(async (_req, user) => {
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  return json({ notifications, unread });
});

/** PATCH — mark all as read. */
export const PATCH = authed(async (_req, user) => {
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return json({ ok: true });
});

/** DELETE — clear all. */
export const DELETE = authed(async (_req, user) => {
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  return json({ ok: true });
});
