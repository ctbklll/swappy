import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "./db";
import type { User } from "@/generated/prisma/client";

export const COOKIE = "swappy_session";
const SECRET = process.env.AUTH_SECRET ?? "dev-only-secret-change-me";

const sign = (v: string) => createHmac("sha256", SECRET).update(v).digest("hex");

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Signed session value. Web uses it as a cookie; the mobile app sends it as `Authorization: Bearer <token>`. */
export const sessionToken = (userId: string) => `${userId}.${sign(userId)}`;

export async function createSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE, sessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const toPublic = (user: User) => {
  const { passwordHash, ...rest } = user;
  void passwordHash;
  return rest;
};

export async function currentUser(): Promise<User | null> {
  const auth = (await headers()).get("authorization");
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7) : (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf(".");
  const id = raw.slice(0, i);
  const sig = raw.slice(i + 1);
  const expected = sign(id);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return prisma.user.findUnique({ where: { id } });
}
