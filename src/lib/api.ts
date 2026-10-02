import "server-only";
import { currentUser } from "./auth";
import type { Prisma, User } from "@/generated/prisma/client";

export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const fail = (message: string, status = 400) => Response.json({ error: message }, { status });

type Ctx = { params: Promise<Record<string, string>> };
type Handler = (req: Request, user: User, ctx: Ctx) => Promise<Response>;

export function authed(handler: Handler, opts: { admin?: boolean } = {}) {
  return async (req: Request, ctx: Ctx) => {
    const user = await currentUser();
    if (!user) return fail("กรุณาเข้าสู่ระบบ", 401);
    if (opts.admin && user.role !== "admin") return fail("ไม่มีสิทธิ์เข้าถึง", 403);
    try {
      return await handler(req, user, ctx);
    } catch (e) {
      console.error(e);
      return fail("เกิดข้อผิดพลาดของระบบ", 500);
    }
  };
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

type Db = Pick<Prisma.TransactionClient, "notification">;

export function notify(
  db: Db,
  userId: string,
  n: { type: string; title: string; body: string; link?: string },
) {
  return db.notification.create({ data: { userId, ...n } });
}

export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isTime = (s: unknown): s is string => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const isColor = (s: unknown): s is string => typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s);
