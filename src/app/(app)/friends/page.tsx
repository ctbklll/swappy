"use client";
import Link from "next/link";
import { useState } from "react";
import { api, useFetch } from "@/lib/client";
import type { PublicUser } from "@/lib/types";
import { AddFriendModal } from "@/components/AddFriendModal";
import { useApp } from "@/components/AppProvider";
import { useT } from "@/components/LangProvider";
import { Avatar, Empty, Icon, btn, card } from "@/components/ui";

interface Entry { friendshipId: string; user: PublicUser }

export default function Friends() {
  const { toast } = useApp();
  const { t, ts } = useT();
  const { data, reload } = useFetch<{ friends: Entry[]; incoming: Entry[]; outgoing: Entry[] }>("/api/friends", { poll: 8000 });
  const [open, setOpen] = useState(false);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast(msg); await reload(); } catch (e) { toast(ts((e as Error).message), "error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("เพื่อนร่วมงาน")}</h1>
        <button onClick={() => setOpen(true)} className={btn.primary}><Icon name="plus" className="h-4 w-4" /> {t("เพิ่มเพื่อน")}</button>
      </div>

      {!!data?.incoming.length && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-500">{t("คำขอเป็นเพื่อน")} ({data.incoming.length})</h2>
          {data.incoming.map((r) => (
            <div key={r.friendshipId} className={`${card} flex items-center gap-3 !p-4 ring-2 ring-blue-100`}>
              <Avatar user={r.user} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.user.name}</p>
                <p className="truncate text-xs text-slate-500">{r.user.email}</p>
              </div>
              <button onClick={() => act(() => api(`/api/friends/${r.friendshipId}`, "PATCH", { action: "decline" }), t("ปฏิเสธคำขอแล้ว"))} className={btn.ghost}>{t("ปฏิเสธ")}</button>
              <button onClick={() => act(() => api(`/api/friends/${r.friendshipId}`, "PATCH", { action: "accept" }), t("เพิ่มเพื่อนแล้ว"))} className={btn.primary}>{t("ตอบรับ")}</button>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-slate-500">{t("รายชื่อเพื่อน")} ({data?.friends.length ?? 0})</h2>
        {data && !data.friends.length && <Empty icon="users" text={t("ยังไม่มีเพื่อน — กดเพิ่มเพื่อนเพื่อเริ่มต้น")} />}
        <div className="grid gap-2 sm:grid-cols-2">
          {data?.friends.map((f) => (
            <div key={f.friendshipId} className={`${card} flex items-center gap-3 !p-4`}>
              <Avatar user={f.user} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{f.user.name}</p>
                <p className="truncate text-xs text-slate-500">{f.user.email}</p>
              </div>
              <Link href={`/swaps?new=1&to=${f.user.id}`} className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600" aria-label={t("ขอแลกเวร")}><Icon name="swap" className="h-4 w-4" /></Link>
              <button aria-label={t("ลบเพื่อน")} onClick={() => confirm(t("ลบ {name} ออกจากเพื่อน?", { name: f.user.name })) && act(() => api(`/api/friends/${f.friendshipId}`, "DELETE"), t("ลบเพื่อนแล้ว"))}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Icon name="trash" className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>

      {!!data?.outgoing.length && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-500">{t("คำขอที่ส่งไป")} ({data.outgoing.length})</h2>
          {data.outgoing.map((r) => (
            <div key={r.friendshipId} className={`${card} flex items-center gap-3 !p-4`}>
              <Avatar user={r.user} size={40} />
              <p className="min-w-0 flex-1 truncate font-semibold">{r.user.name} <span className="text-xs font-normal text-slate-400">{t("รอตอบรับ")}</span></p>
              <button onClick={() => act(() => api(`/api/friends/${r.friendshipId}`, "DELETE"), t("ยกเลิกคำขอแล้ว"))} className={btn.ghost}>{t("ยกเลิก")}</button>
            </div>
          ))}
        </section>
      )}
      <AddFriendModal open={open} onClose={() => setOpen(false)} onDone={() => void reload()} />
    </div>
  );
}
