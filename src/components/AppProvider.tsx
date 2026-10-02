"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, useFetch } from "@/lib/client";
import { useT } from "./LangProvider";
import type { Notification, PublicUser } from "@/lib/types";

interface Ctx {
  user: PublicUser;
  setUser: (u: PublicUser) => void;
  notifications: Notification[];
  unread: number;
  reloadNotifications: () => Promise<void>;
  toast: (msg: string, kind?: "ok" | "error") => void;
  sheetOpen: boolean;
  setSheetOpen: (v: boolean) => void;
  logout: () => Promise<void>;
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { tn } = useT();
  const me = useFetch<{ user: PublicUser }>("/api/me");
  const notif = useFetch<{ notifications: Notification[]; unread: number }>("/api/notifications", { poll: 5000 });
  const [user, setUserState] = useState<PublicUser | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: "ok" | "error" }[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me.data) setUserState(me.data.user);
  }, [me.data]);

  useEffect(() => {
    if (me.error && !me.data)
      // Stale/invalid session cookie: clear it first, otherwise proxy.ts bounces /login back to /.
      void api("/api/auth/logout", "POST").finally(() => router.replace("/login"));
  }, [me.error, me.data, router]);

  const toast = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  // Real-time-ish: surface newly arrived notifications as toasts.
  useEffect(() => {
    if (!notif.data) return;
    const ids = new Set(notif.data.notifications.map((n) => n.id));
    if (seen.current) {
      for (const n of notif.data.notifications) if (!seen.current.has(n.id)) { const x = tn(n); toast(`${x.title} — ${x.body}`); }
    }
    seen.current = ids;
  }, [notif.data, toast, tn]);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", "POST");
    router.replace("/login");
  }, [router]);

  if (!user)
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      </div>
    );

  return (
    <AppCtx.Provider
      value={{
        user, setUser: setUserState,
        notifications: notif.data?.notifications ?? [],
        unread: notif.data?.unread ?? 0,
        reloadNotifications: notif.reload,
        toast, sheetOpen, setSheetOpen, logout,
      }}
    >
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-900/10 ${
              t.kind === "error" ? "bg-rose-600" : "bg-blue-700"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}
