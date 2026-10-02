"use client";
import { useState } from "react";
import { api, useFetch } from "@/lib/client";
import { addDays, fmt, shortDate, today } from "@/lib/dates";
import type { PublicUser, Shift, ShiftTemplate } from "@/lib/types";
import { useApp } from "./AppProvider";
import { useT } from "./LangProvider";
import { Avatar, Dropdown, Empty, Modal, btn, card, input } from "./ui";

type Tpl = Pick<ShiftTemplate, "name" | "color" | "start" | "end">;
type ShiftWithTpl = Pick<Shift, "id" | "date"> & { template: Tpl | null };
interface Interest { id: string; status: "pending" | "chosen" | "rejected"; note: string; user: PublicUser; shift: ShiftWithTpl | null }
interface MyPost { id: string; note: string; allowGiveaway: boolean; status: "open" | "matched" | "cancelled"; shift: ShiftWithTpl; interests: Interest[] }
interface BoardPost { id: string; note: string; allowGiveaway: boolean; poster: PublicUser; shift: ShiftWithTpl; myInterest: { id: string; shiftId: string | null; note: string } | null }

function Chip({ s }: { s: ShiftWithTpl | null }) {
  const { t, lang } = useT();
  if (!s) return <span className="text-sm text-slate-400">{t("รับเวรไปเลย (ไม่แลกกลับ)")}</span>;
  const c = s.template?.color ?? "#64748b";
  return (
    <span className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm" style={{ background: c + "1a" }}>
      <span className="h-5 w-1 rounded-full" style={{ background: c }} />
      <b>{shortDate(s.date, lang)}</b> {s.template?.name} <span className="text-xs text-slate-500">{s.template?.start}-{s.template?.end}</span>
    </span>
  );
}

/** Pick one of my upcoming shifts (used when announcing and when showing interest). */
function ShiftSelect({ value, onChange, allowNone, noneLabel }: { value: string; onChange: (v: string) => void; allowNone?: boolean; noneLabel?: string }) {
  const { t, lang } = useT();
  const mine = useFetch<{ shifts: Shift[]; templates: ShiftTemplate[] }>(`/api/shifts?from=${today()}&to=${fmt(addDays(new Date(), 60))}`);
  const label = (s: Shift) => {
    const tp = mine.data?.templates.find((x) => x.id === s.templateId);
    return `${shortDate(s.date, lang)} · ${tp?.name ?? ""} ${tp?.start ?? ""}-${tp?.end ?? ""}`;
  };
  return (
    <Dropdown value={value} onChange={onChange} placeholder={allowNone ? noneLabel : t("เลือกเวรของฉัน…")}
      options={[...(allowNone ? [{ value: "", label: noneLabel ?? "" }] : []), ...(mine.data?.shifts ?? []).map((s) => ({ value: s.id, label: label(s) }))]} />
  );
}

export function SwapBoard({ createOpen, onCreateClose }: { createOpen: boolean; onCreateClose: () => void }) {
  const { toast } = useApp();
  const { t, ts } = useT();
  const { data, reload } = useFetch<{ board: BoardPost[]; mine: MyPost[] }>("/api/posts", { poll: 8000 });
  const [interestFor, setInterestFor] = useState<BoardPost | null>(null);

  // create-post form
  const [shiftId, setShiftId] = useState("");
  const [note, setNote] = useState("");
  const [giveaway, setGiveaway] = useState(false);
  // interest form
  const [offer, setOffer] = useState("");
  const [inote, setInote] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast(ok); await reload(); return true; } catch (e) { toast(ts((e as Error).message), "error"); return false; } finally { setBusy(false); }
  };

  const create = async () => {
    if (await run(() => api("/api/posts", "POST", { shiftId, note, allowGiveaway: giveaway }), t("ประกาศแลกเวรแล้ว"))) {
      setShiftId(""); setNote(""); setGiveaway(false); onCreateClose();
    }
  };

  const openInterest = (p: BoardPost) => { setInterestFor(p); setOffer(p.myInterest?.shiftId ?? ""); setInote(p.myInterest?.note ?? ""); };
  const sendInterest = async () => {
    if (!interestFor) return;
    if (await run(() => api(`/api/posts/${interestFor.id}/interest`, "POST", { shiftId: offer || null, note: inote }), t("ส่งความสนใจแล้ว"))) setInterestFor(null);
  };

  const myOpen = data?.mine.filter((p) => p.status === "open") ?? [];
  const myClosed = data?.mine.filter((p) => p.status !== "open") ?? [];

  return (
    <div className="space-y-6">
      <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">{t("ประกาศเวรที่อยากแลก เพื่อนที่สนใจจะเสนอเวรของเขามาให้ คุณเลือกคนที่ต้องการแลกด้วยได้")}</p>

      {/* my announcements */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-500">{t("ประกาศของฉัน")} ({myOpen.length})</h2>
        {data && !myOpen.length && <Empty icon="swap" text={t("ยังไม่มีประกาศ — กด “ประกาศแลกเวร” เพื่อเริ่ม")} />}
        {myOpen.map((p) => (
          <div key={p.id} className={`${card} space-y-3 !p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Chip s={p.shift} />
              <button className={btn.danger} onClick={() => confirm(t("ยกเลิกประกาศนี้?")) && run(() => api(`/api/posts/${p.id}`, "DELETE"), t("ยกเลิกประกาศแล้ว"))}>{t("ยกเลิกประกาศ")}</button>
            </div>
            {p.note && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">“{p.note}”</p>}
            {p.allowGiveaway && <p className="text-xs text-slate-400">{t("รับคนที่ไม่แลกเวรกลับได้")}</p>}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400">{t("ผู้สนใจ")} ({p.interests.filter((i) => i.status === "pending").length})</p>
              {!p.interests.some((i) => i.status === "pending") && <p className="text-sm text-slate-400">{t("ยังไม่มีผู้สนใจ")}</p>}
              {p.interests.filter((i) => i.status === "pending").map((i) => (
                <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <Avatar user={i.user} size={36} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-semibold">{i.user.name}</p>
                    <Chip s={i.shift} />
                    {i.note && <p className="text-xs text-slate-500">“{i.note}”</p>}
                  </div>
                  <button disabled={busy} className={btn.primary}
                    onClick={() => confirm(t("เลือก {name} แลกเวรด้วย? ระบบจะสลับเวรทันที", { name: i.user.name })) && run(() => api(`/api/posts/${p.id}/choose`, "POST", { interestId: i.id }), t("แลกเวรสำเร็จ"))}>
                    {t("เลือกคนนี้")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {myClosed.slice(0, 3).map((p) => (
          <div key={p.id} className={`${card} flex flex-wrap items-center gap-3 !p-4 opacity-70`}>
            <Chip s={p.shift} />
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.status === "matched" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {p.status === "matched" ? t("แลกแล้ว") : t("ยกเลิก")}
            </span>
          </div>
        ))}
      </section>

      {/* friends' announcements */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-500">{t("ประกาศจากเพื่อน")} ({data?.board.length ?? 0})</h2>
        {data && !data.board.length && <Empty icon="users" text={t("ยังไม่มีประกาศจากเพื่อน")} />}
        {data?.board.map((p) => (
          <div key={p.id} className={`${card} space-y-3 !p-4`}>
            <div className="flex items-center gap-3">
              <Avatar user={p.poster} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.poster.name}</p>
                <p className="text-xs text-slate-400">{t("อยากแลกเวร")}</p>
              </div>
              <Chip s={p.shift} />
            </div>
            {p.note && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">“{p.note}”</p>}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {p.allowGiveaway && <span className="mr-auto text-xs text-slate-400">{t("รับคนที่ไม่แลกเวรกลับได้")}</span>}
              {p.myInterest ? (
                <>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{t("สนใจแล้ว — รอผู้ประกาศเลือก")}</span>
                  <button className={btn.ghost} onClick={() => openInterest(p)}>{t("แก้ไข")}</button>
                  <button className={btn.ghost} onClick={() => run(() => api(`/api/posts/${p.id}/interest`, "DELETE"), t("ยกเลิกความสนใจแล้ว"))}>{t("ยกเลิกความสนใจ")}</button>
                </>
              ) : (
                <button className={btn.primary} onClick={() => openInterest(p)}>{t("สนใจแลก")}</button>
              )}
            </div>
          </div>
        ))}
      </section>

      <Modal open={createOpen} onClose={onCreateClose} title={t("ประกาศแลกเวร")}>
        <div className="space-y-3">
          <label className="block space-y-1 text-xs font-semibold text-slate-500">{t("เวรที่ต้องการแลก")}
            <ShiftSelect value={shiftId} onChange={setShiftId} />
          </label>
          <textarea className={input} rows={2} maxLength={200} placeholder={t("ข้อความ เช่น อยากได้เวรเช้าแทน (ไม่บังคับ)")} value={note} onChange={(e) => setNote(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={giveaway} onChange={(e) => setGiveaway(e.target.checked)} className="h-4 w-4 accent-blue-600" />
            {t("รับคนที่ไม่แลกเวรกลับได้ (ยกเวรให้เฉยๆ)")}
          </label>
          <p className="text-xs text-slate-400">{t("ประกาศนี้จะแสดงให้เพื่อนของคุณเท่านั้น")}</p>
          <button disabled={busy || !shiftId} onClick={create} className={`${btn.primary} w-full`}>{t("ประกาศ")}</button>
        </div>
      </Modal>

      <Modal open={!!interestFor} onClose={() => setInterestFor(null)} title={t("สนใจแลกเวร")}>
        {interestFor && (
          <div className="space-y-3">
            <div className="space-y-1 rounded-2xl bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-400">{t("เวรของ {name}", { name: interestFor.poster.name })}</p>
              <Chip s={interestFor.shift} />
            </div>
            <label className="block space-y-1 text-xs font-semibold text-slate-500">{t("เวรของฉันที่เสนอแลก")}
              <ShiftSelect value={offer} onChange={setOffer} allowNone={interestFor.allowGiveaway} noneLabel={t("รับเวรไปเลย (ไม่แลกกลับ)")} />
            </label>
            <textarea className={input} rows={2} maxLength={200} placeholder={t("ข้อความถึงผู้ประกาศ (ไม่บังคับ)")} value={inote} onChange={(e) => setInote(e.target.value)} />
            <button disabled={busy || (!offer && !interestFor.allowGiveaway)} onClick={sendInterest} className={`${btn.primary} w-full`}>{t("ส่งความสนใจ")}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
