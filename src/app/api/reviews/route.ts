import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authed, body, fail, json } from "@/lib/api";

/** "สมชาย ใจดี" -> "สมชาย ใ." — show a first name and an initial only. */
const shortName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${[...parts[1]][0]}.` : parts[0];
};

/** Public: latest reviews + summary. If the caller is signed in, also tells which review is theirs. */
export async function GET() {
  const me = await currentUser();
  const [rows, agg] = await Promise.all([
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { name: true } } } }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
  ]);
  const mine = me ? await prisma.review.findUnique({ where: { userId: me.id } }) : null;
  return json({
    reviews: rows.map((r) => ({
      id: r.id, name: shortName(r.user.name), rating: r.rating, comment: r.comment, createdAt: r.createdAt,
      canDelete: !!me && (me.role === "admin" || me.id === r.userId),
    })),
    count: agg._count,
    average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
    signedIn: !!me,
    mine: mine ? { rating: mine.rating, comment: mine.comment } : null,
  });
}

/** POST { rating: 1-5, comment } — creates or replaces the signed-in user's review. */
export const POST = authed(async (req, user) => {
  const b = await body<{ rating?: number; comment?: string }>(req);
  const rating = Number(b.rating);
  const comment = (b.comment ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("กรุณาให้คะแนน 1-5 ดาว");
  if (comment.length < 5) return fail("กรุณาเขียนรีวิวอย่างน้อย 5 ตัวอักษร");
  if (comment.length > 300) return fail("รีวิวต้องไม่เกิน 300 ตัวอักษร");
  await prisma.review.upsert({
    where: { userId: user.id },
    create: { userId: user.id, rating, comment },
    update: { rating, comment },
  });
  return json({ ok: true }, 201);
});
