import "server-only";
import type { Prisma } from "@/generated/prisma/client";

/** Map a template onto the receiving user's equivalent (same name); clone it for them if none exists. */
async function tplFor(tx: Prisma.TransactionClient, ownerId: string, templateId: string) {
  const src = await tx.shiftTemplate.findUnique({ where: { id: templateId } });
  if (!src || src.userId === ownerId) return templateId;
  const match =
    (await tx.shiftTemplate.findFirst({ where: { userId: ownerId, name: src.name, start: src.start, end: src.end } })) ??
    (await tx.shiftTemplate.findFirst({ where: { userId: ownerId, name: src.name } })) ??
    (await tx.shiftTemplate.create({
      data: { userId: ownerId, name: src.name, start: src.start, end: src.end, color: src.color },
    }));
  return match.id;
}

/**
 * Perform a shift swap inside a transaction.
 *  - `aShiftId` (owned by `aOwner`) moves to `bOwner`
 *  - `bShiftId` (owned by `bOwner`, optional) moves to `aOwner`; omit it for a give-away
 * Returns false when either shift no longer belongs to the expected person (nothing is changed then).
 *
 * One shift per user per day: whatever the receiver already has on an incoming date is replaced.
 */
export async function executeSwap(
  tx: Prisma.TransactionClient,
  aShiftId: string, aOwner: string,
  bShiftId: string | null, bOwner: string,
): Promise<boolean> {
  const a = await tx.shift.findFirst({ where: { id: aShiftId, userId: aOwner } });
  const b = bShiftId ? await tx.shift.findFirst({ where: { id: bShiftId, userId: bOwner } }) : null;
  if (!a || (bShiftId && !b)) return false;

  const aTpl = await tplFor(tx, bOwner, a.templateId);
  const bTpl = b ? await tplFor(tx, aOwner, b.templateId) : null;

  if (b && a.date === b.date) {
    // same day: nobody moves, they just exchange shift types
    await tx.shift.update({ where: { id: a.id }, data: { templateId: bTpl! } });
    await tx.shift.update({ where: { id: b.id }, data: { templateId: aTpl } });
  } else {
    await tx.shift.deleteMany({ where: { userId: bOwner, date: a.date, id: { not: b?.id ?? "" } } });
    if (b) await tx.shift.deleteMany({ where: { userId: aOwner, date: b.date, id: { not: a.id } } });
    await tx.shift.update({ where: { id: a.id }, data: { userId: bOwner, templateId: aTpl } });
    if (b) await tx.shift.update({ where: { id: b.id }, data: { userId: aOwner, templateId: bTpl! } });
  }
  return true;
}
