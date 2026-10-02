"use client";
import { useEffect, useState } from "react";
import { api, useFetch } from "@/lib/client";
import { addDays, fmt, parse, today } from "@/lib/dates";
import type { ShiftTemplate } from "@/lib/types";
import { useApp } from "./AppProvider";
import { useT } from "./LangProvider";
import { TemplatesModal } from "./TemplatesModal";
import { Modal, btn, input } from "./ui";

export function AssignShiftModal({ open, onClose, initialDate, onDone }: {
  open: boolean; onClose: () => void; initialDate?: string; onDone: () => void;
}) {
  const { toast } = useApp();
  const { t, ts } = useT();
  const tpls = useFetch<{ templates: ShiftTemplate[] }>(open ? "/api/templates" : null);
  const [from, setFrom] = useState(initialDate ?? today());
  const [to, setTo] = useState(initialDate ?? today());
  const [tplId, setTplId] = useState("");
  const [busy, setBusy] = useState(false);
  const [manage, setManage] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) { setFrom(initialDate ?? today()); setTo(initialDate ?? today()); }
  }, [open, initialDate]);

  const list = tpls.data?.templates ?? [];
  const selected = tplId || list[0]?.id || "";

  const dates = () => {
    const out: string[] = [];
    for (let d = parse(from); fmt(d) <= to && out.length < 62; d = addDays(d, 1)) out.push(fmt(d));
    return out;
  };

  const run = async (clear: boolean) => {
    const ds = dates();
    if (!ds.length) return toast(t("ช่วงวันที่ไม่ถูกต้อง"), "error");
    setBusy(true);
    try {
      if (clear) await api("/api/shifts", "DELETE", { dates: ds });
      else await api("/api/shifts", "POST", { dates: ds, templateId: selected });
      toast(clear ? t("ลบเวรแล้ว") : t("บันทึกเวร {n} วันแล้ว", { n: ds.length }));
      onDone();
      onClose();
    } catch (e) {
      toast(ts((e as Error).message), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("เพิ่ม / แก้ไขเวร")}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-semibold text-slate-500">{t("ตั้งแต่วันที่")}
            <input type="date" className={input} value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value > to) setTo(e.target.value); }} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-500">{t("ถึงวันที่")}
            <input type="date" className={input} value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">{t("เลือกกะ")}</p>
            <button onClick={() => setManage(true)} className="text-xs font-semibold text-blue-600 hover:underline">{t("+ เพิ่ม / แก้ไข / ลบกะ")}</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {list.map((t) => (
              <button key={t.id} onClick={() => setTplId(t.id)}
                className={`flex items-center gap-3 rounded-2xl p-3 text-left ring-1 transition ${selected === t.id ? "bg-blue-50 ring-2 ring-blue-600" : "bg-white ring-slate-200"}`}>
                <span className="h-8 w-1.5 rounded-full" style={{ background: t.color }} />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{t.name}</span>
                  <span className="text-xs text-slate-500">{t.start} - {t.end}</span>
                </span>
              </button>
            ))}
          </div>
          {!list.length && !tpls.loading && <p className="text-sm text-slate-400">{t("ยังไม่มีกะ — กด “เพิ่ม / แก้ไข / ลบกะ” เพื่อสร้างกะแรก")}</p>}
        </div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => run(true)} className={btn.danger}>{t("ล้างเวร")}</button>
          <button disabled={busy || !selected} onClick={() => run(false)} className={`${btn.primary} flex-1`}>{t("บันทึกเวร")}</button>
        </div>
      </div>
      <TemplatesModal open={manage} onClose={() => setManage(false)} onChanged={() => { void tpls.reload(); onDone(); }} />
    </Modal>
  );
}
