"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api, useFetch } from "@/lib/client";
import type { PublicUser } from "@/lib/types";
import { useApp } from "@/components/AppProvider";
import { useT } from "@/components/LangProvider";
import { Avatar, Icon, card } from "@/components/ui";

type AdminUser = PublicUser & { shiftCount: number };
interface Stats { users: number; shifts: number; templates: number; swapsPending: number; swapsAccepted: number; friendships: number }

export default function Admin() {
  const { user, toast } = useApp();
  const { t, ts } = useT();
  const router = useRouter();
  const { data, reload } = useFetch<{ users: AdminUser[]; stats: Stats }>(user.role === "admin" ? "/api/admin/users" : null);

  useEffect(() => { if (user.role !== "admin") router.replace("/"); }, [user.role, router]);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast(msg); await reload(); } catch (e) { toast(ts((e as Error).message), "error"); }
  };

  const s = data?.stats;
  const tiles: [string, number | undefined][] = [
    [t("ผู้ใช้ทั้งหมด"), s?.users], [t("เวรทั้งหมด"), s?.shifts], [t("กะที่สร้าง"), s?.templates],
    [t("เพื่อน"), s?.friendships], [t("แลกเวรรอตอบ"), s?.swapsPending], [t("แลกเวรสำเร็จ"), s?.swapsAccepted],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white"><Icon name="shield" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t("ผู้ดูแลระบบ")}</h1>
          <p className="text-sm text-slate-500">{t("ภาพรวมและการจัดการผู้ใช้")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {tiles.map(([l, v]) => (
          <div key={l} className={`${card} !p-4`}>
            <p className="text-xs text-slate-500">{l}</p>
            <p className="mt-1 text-2xl font-extrabold text-blue-700">{v ?? "–"}</p>
          </div>
        ))}
      </div>

      <section className={`${card} !p-2 sm:!p-4`}>
        <h2 className="mb-2 px-2 font-bold">{t("ผู้ใช้ทั้งหมด")}</h2>
        <ul className="divide-y divide-slate-100">
          {data?.users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 p-2 sm:p-3">
              <Avatar user={u} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{u.name} {u.id === user.id && <span className="text-xs font-normal text-slate-400">({t("คุณ")})</span>}</p>
                <p className="truncate text-xs text-slate-500">{u.email} · {u.shiftCount} {t("เวร")} · <span className="font-mono">{u.code}</span></p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{u.role === "admin" ? "Admin" : "User"}</span>
              {u.id !== user.id && (
                <>
                  <button className="rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                    onClick={() => run(() => api(`/api/admin/users/${u.id}`, "PATCH", { role: u.role === "admin" ? "user" : "admin" }), t("เปลี่ยนสิทธิ์แล้ว"))}>
                    {u.role === "admin" ? t("ลดสิทธิ์") : t("เป็น Admin")}
                  </button>
                  <button aria-label={t("ลบผู้ใช้")} className="grid h-8 w-8 place-items-center rounded-xl text-rose-500 hover:bg-rose-50"
                    onClick={() => confirm(t("ลบผู้ใช้ {name}? ข้อมูลทั้งหมดของผู้ใช้จะถูกลบ", { name: u.name })) && run(() => api(`/api/admin/users/${u.id}`, "DELETE"), t("ลบผู้ใช้แล้ว"))}>
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
