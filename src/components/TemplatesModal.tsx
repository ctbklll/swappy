"use client";
import { useState } from "react";
import { api, useFetch } from "@/lib/client";
import { hours } from "@/lib/dates";
import type { ShiftTemplate } from "@/lib/types";
import { useApp } from "./AppProvider";
import { useT } from "./LangProvider";
import { Icon, Modal, btn, input } from "./ui";

const COLORS = ["#2563eb", "#0ea5e9", "#14b8a6", "#22c55e", "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#7c3aed", "#64748b"];
const blank = { name: "", start: "08:00", end: "16:00", color: COLORS[0] };

export function TemplatesModal({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: () => void }) {
  const { toast } = useApp();
  const { t, ts } = useT();
  const { data, reload } = useFetch<{ templates: ShiftTemplate[] }>(open ? "/api/templates" : null);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = async (msg: string) => {
    toast(msg);
    setForm(blank);
    setEditing(null);
    await reload();
    onChanged();
  };

  const save = async () => {
    if (!form.name.trim()) return toast(t("กรอกชื่อกะ"), "error");
    setBusy(true);
    try {
      if (editing) await api(`/api/templates/${editing}`, "PUT", form);
      else await api("/api/templates", "POST", form);
      await done(editing ? t("แก้ไขกะแล้ว") : t("สร้างกะแล้ว"));
    } catch (e) {
      toast(ts((e as Error).message), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (tpl: ShiftTemplate) => {
    if (!confirm(t("ลบกะ \"{name}\"? เวรที่ใช้กะนี้จะถูกลบด้วย", { name: tpl.name }))) return;
    try {
      await api(`/api/templates/${tpl.id}`, "DELETE");
      await done(t("ลบกะแล้ว"));
    } catch (e) {
      toast(ts((e as Error).message), "error");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("จัดการกะงาน (Shift Templates)")}>
      <ul className="mb-5 space-y-2">
        {data?.templates.map((x) => (
          <li key={x.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <span className="h-10 w-1.5 rounded-full" style={{ background: x.color }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{x.name}</p>
              <p className="text-xs text-slate-500">{x.start} - {x.end} · {hours(x.start, x.end)} {t("ชม.")}</p>
            </div>
            <button aria-label={t("แก้ไข")} onClick={() => { setEditing(x.id); setForm({ name: x.name, start: x.start, end: x.end, color: x.color }); }}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-white"><Icon name="edit" className="h-4 w-4" /></button>
            <button aria-label={t("ลบ")} onClick={() => remove(x)} className="grid h-9 w-9 place-items-center rounded-xl text-rose-500 hover:bg-white"><Icon name="trash" className="h-4 w-4" /></button>
          </li>
        ))}
        {data && !data.templates.length && <li className="py-4 text-center text-sm text-slate-400">{t("ยังไม่มีกะงาน")}</li>}
      </ul>

      <div className="space-y-3 rounded-3xl bg-blue-50/60 p-4">
        <p className="text-sm font-bold text-blue-800">{editing ? t("แก้ไขกะ") : t("สร้างกะใหม่")}</p>
        <input className={input} placeholder={t("ชื่อกะ เช่น เช้า, บ่าย, ดึก")} value={form.name} maxLength={30}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-semibold text-slate-500">{t("เริ่ม")}
            <input type="time" className={input} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-500">{t("สิ้นสุด")}
            <input type="time" className={input} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </label>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500">{t("สีประจำกะ")}</p>
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button key={c} aria-label={c} onClick={() => setForm({ ...form, color: c })}
                className={`h-8 w-8 rounded-full ring-offset-2 transition ${form.color === c ? "ring-2 ring-slate-900" : ""}`} style={{ background: c }} />
            ))}
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label={t("เลือกสีเอง")} />
          </div>
        </div>
        <div className="flex gap-2">
          {editing && <button className={btn.ghost} onClick={() => { setEditing(null); setForm(blank); }}>{t("ยกเลิก")}</button>}
          <button disabled={busy} onClick={save} className={`${btn.primary} flex-1`}>{editing ? t("บันทึกการแก้ไข") : t("เพิ่มกะ")}</button>
        </div>
      </div>
    </Modal>
  );
}
