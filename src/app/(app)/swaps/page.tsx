"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, useFetch } from "@/lib/client";
import { addDays, fmt, shortDate, today } from "@/lib/dates";
import type { PublicUser, Shift, ShiftTemplate, Swap } from "@/lib/types";
import { useApp } from "@/components/AppProvider";
import { useT, } from "@/components/LangProvider";
import { SwapBoard } from "@/components/SwapBoard";
import { Avatar, Dropdown, Empty, Modal, btn, card, input } from "@/components/ui";

type WithTpl = (Shift & { template: ShiftTemplate | null }) | null;
type SwapView = Swap & { requester: PublicUser | null; target: PublicUser | null; requesterShift: WithTpl; targetShift: WithTpl };

const STATUS: Record<Swap["status"], { label: string; cls: string }> = {
  pending: { label: "รอตอบรับ", cls: "bg-amber-50 text-amber-700" },
  accepted: { label: "อนุมัติแล้ว", cls: "bg-emerald-50 text-emerald-700" },
  declined: { label: "ปฏิเสธ", cls: "bg-rose-50 text-rose-600" },
  cancelled: { label: "ยกเลิก", cls: "bg-slate-100 text-slate-500" },
};

function ShiftChip({ s }: { s: WithTpl }) {
  const { t, lang } = useT();
  if (!s) return <span className="text-sm text-slate-400">{t("— ไม่มี (ยกให้) —")}</span>;
  return (
    <span className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm" style={{ background: (s.template?.color ?? "#64748b") + "1a" }}>
      <span className="h-5 w-1 rounded-full" style={{ background: s.template?.color }} />
      <b>{shortDate(s.date, lang)}</b> {s.template?.name} <span className="text-xs text-slate-500">{s.template?.start}-{s.template?.end}</span>
    </span>
  );
}

function NewSwap({ open, onClose, onDone, presetTo }: { open: boolean; onClose: () => void; onDone: () => void; presetTo?: string }) {
  const { user, toast } = useApp();
  const { t, ts, lang } = useT();
  const friends = useFetch<{ friends: { user: PublicUser }[] }>(open ? "/api/friends" : null);
  const [to, setTo] = useState(presetTo ?? "");
  const [mine, setMine] = useState("");
  const [theirs, setTheirs] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const from = today();
  const until = fmt(addDays(new Date(), 60));
  const myShifts = useFetch<{ shifts: Shift[]; templates: ShiftTemplate[] }>(open ? `/api/shifts?from=${from}&to=${until}` : null);
  const theirShifts = useFetch<{ shifts: Shift[]; templates: ShiftTemplate[] }>(open && to ? `/api/shifts?from=${from}&to=${until}&userId=${to}` : null);

  const label = (s: Shift, tpls?: ShiftTemplate[]) => {
    const tp = tpls?.find((x) => x.id === s.templateId);
    return `${shortDate(s.date, lang)} · ${tp?.name ?? ""} ${tp?.start ?? ""}-${tp?.end ?? ""}`;
  };

  const submit = async () => {
    setBusy(true);
    try {
      await api("/api/swaps", "POST", { targetId: to, requesterShiftId: mine, targetShiftId: theirs || null, note });
      toast(t("ส่งคำขอแลกเวรแล้ว"));
      setMine(""); setTheirs(""); setNote("");
      onDone(); onClose();
    } catch (e) { toast(ts((e as Error).message), "error"); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("ขอแลกเวร")}>
      <div className="space-y-3">
        <label className="block space-y-1 text-xs font-semibold text-slate-500">{t("แลกกับ")}
          <Dropdown value={to} onChange={(v) => { setTo(v); setTheirs(""); }} placeholder={t("เลือกเพื่อน…")}
            options={(friends.data?.friends ?? []).map((f) => ({ value: f.user.id, label: f.user.name }))} />
        </label>
        <label className="block space-y-1 text-xs font-semibold text-slate-500">{t("เวรของฉัน")} ({user.name})
          <Dropdown value={mine} onChange={setMine} placeholder={t("เลือกเวรของฉัน…")}
            options={(myShifts.data?.shifts ?? []).map((s) => ({ value: s.id, label: label(s, myShifts.data?.templates) }))} />
        </label>
        <label className="block space-y-1 text-xs font-semibold text-slate-500">{t("เวรของเพื่อน")}
          <Dropdown value={theirs} onChange={setTheirs} disabled={!to} placeholder={t("ไม่แลก — ยกเวรให้เพื่อน")}
            options={[{ value: "", label: t("ไม่แลก — ยกเวรให้เพื่อน") }, ...(theirShifts.data?.shifts ?? []).map((s) => ({ value: s.id, label: label(s, theirShifts.data?.templates) }))]} />
        </label>
        <textarea className={input} rows={2} placeholder={t("ข้อความถึงเพื่อน (ไม่บังคับ)")} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
        <button disabled={busy || !to || !mine} onClick={submit} className={`${btn.primary} w-full`}>{t("ส่งคำขอ")}</button>
      </div>
    </Modal>
  );
}

function SwapsInner() {
  const { user, toast } = useApp();
  const { t, ts, lang } = useT();
  const params = useSearchParams();
  const { data, reload } = useFetch<{ swaps: SwapView[] }>("/api/swaps", { poll: 8000 });
  const [open, setOpen] = useState(params.get("new") === "1");
  const [tab, setTab] = useState<"direct" | "board">(params.get("tab") === "board" ? "board" : "direct");
  const [postOpen, setPostOpen] = useState(false);

  const act = async (id: string, action: string, msg: string) => {
    try { await api(`/api/swaps/${id}`, "PATCH", { action }); toast(msg); await reload(); } catch (e) { toast(ts((e as Error).message), "error"); await reload(); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("แลกเปลี่ยนเวร")}</h1>
        {tab === "direct"
          ? <button className={btn.primary} onClick={() => setOpen(true)}>{t("+ ขอแลกเวร")}</button>
          : <button className={btn.primary} onClick={() => setPostOpen(true)}>{t("+ ประกาศแลกเวร")}</button>}
      </div>
      <div className="grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1 text-sm font-semibold" role="tablist">
        {([["direct", "คำขอถึงเพื่อน"], ["board", "กระดานแลกเวร"]] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-xl py-2 transition ${tab === k ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>{t(label)}</button>
        ))}
      </div>
      {tab === "board" && <SwapBoard createOpen={postOpen} onCreateClose={() => setPostOpen(false)} />}
      {tab === "direct" && data && !data.swaps.length && <Empty icon="swap" text={t("ยังไม่มีคำขอแลกเวร")} />}
      <div className="space-y-3">
        {(tab === "direct" ? data?.swaps : [])?.map((s) => {
          const mineReq = s.requesterId === user.id;
          const other = mineReq ? s.target : s.requester;
          return (
            <div key={s.id} className={`${card} space-y-3 !p-4`}>
              <div className="flex items-center gap-3">
                {other && <Avatar user={other} size={40} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{mineReq ? `${t("ฉัน")} → ${other?.name}` : `${other?.name} → ${t("ฉัน")}`}</p>
                  <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleString(lang === "th" ? "th-TH" : "en-GB")}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[s.status].cls}`}>{t(STATUS[s.status].label)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <ShiftChip s={s.requesterShift} /> <span className="text-blue-600">⇄</span> <ShiftChip s={s.targetShift} />
              </div>
              {s.note && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">“{s.note}”</p>}
              {s.status === "pending" && (
                <div className="flex justify-end gap-2">
                  {mineReq ? (
                    <button className={btn.ghost} onClick={() => act(s.id, "cancel", t("ยกเลิกคำขอแล้ว"))}>{t("ยกเลิกคำขอ")}</button>
                  ) : (
                    <>
                      <button className={btn.ghost} onClick={() => act(s.id, "decline", t("ปฏิเสธแล้ว"))}>{t("ปฏิเสธ")}</button>
                      <button className={btn.primary} onClick={() => act(s.id, "accept", t("แลกเวรสำเร็จ"))}>{t("ตอบรับ")}</button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <NewSwap key={String(open)} open={open} onClose={() => setOpen(false)} onDone={() => void reload()} presetTo={params.get("to") ?? undefined} />
    </div>
  );
}

export default function Swaps() {
  return <Suspense><SwapsInner /></Suspense>;
}
