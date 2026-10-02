"use client";
import Link from "next/link";
import { useState } from "react";
import { useT } from "./LangProvider";
import { WidgetMock, type MockTag, type MockView } from "./WidgetMock";
import { Icon } from "./ui";

const VIEWS: { id: MockView; label: string }[] = [
  { id: "list", label: "รายการ" },
  { id: "month", label: "เดือน" },
  { id: "two-weeks", label: "2 สัปดาห์" },
  { id: "week", label: "สัปดาห์" },
];
const TAGS: { id: MockTag; label: string }[] = [
  { id: "bar", label: "Bar" }, { id: "dot", label: "Dot" }, { id: "block", label: "Block" }, { id: "letter", label: "Letter" },
];
const POINTS = [
  "เลือกได้ 4 มุมมอง: รายการ เดือน 2 สัปดาห์ สัปดาห์",
  "4 รูปแบบแท็ก: Bar, Dot, Block, Letter",
  "เพิ่มลงหน้าจอหลักได้จากในแอป มีตัวอย่างให้ดูก่อนบันทึก",
  "อัปเดตอัตโนมัติเมื่อมีการแก้ตารางเวร",
];

function Chips<T extends string>({ value, options, onChange, label }: {
  value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  const { t } = useT();
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)} aria-pressed={value === o.id}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${value === o.id ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {o.label === "Bar" || o.label === "Dot" || o.label === "Block" || o.label === "Letter" ? o.label : t(o.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Landing-page section: interactive widget mock-up (pick a view + tag style and see the widget change). */
export function WidgetShowcase() {
  const { t } = useT();
  const [view, setView] = useState<MockView>("month");
  const [tag, setTag] = useState<MockTag>("dot");

  return (
    <section id="widget" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-bold text-blue-600">{t("วิดเจ็ต")}</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{t("วิดเจ็ตบนหน้าจอหลัก")}</h2>
          <p className="mt-3 text-slate-500">{t("ดูเวรวันนี้และเวรถัดไปได้ทันทีโดยไม่ต้องเปิดแอป เลือกมุมมองและรูปแบบแท็กได้ตามใจ")}</p>
        </div>

        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Phone wallpaper with the widget on it */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-gradient-to-br from-blue-200/70 via-sky-100/60 to-transparent blur-2xl" />
            <div className="rounded-[2.5rem] bg-slate-900 p-2.5 shadow-2xl shadow-blue-900/20">
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-indigo-900 via-blue-700 to-orange-400 px-4 pb-5 pt-9">
                <span className="absolute left-1/2 top-2.5 h-4 w-16 -translate-x-1/2 rounded-full bg-black/70" />
                <p className="mb-3 text-center text-3xl font-light text-white/90">11:43</p>
                <WidgetMock view={view} tag={tag} />
                <div className="mt-4 grid grid-cols-4 gap-3 opacity-80">
                  {["#22c55e", "#ffffff", "#f59e0b", "#0ea5e9"].map((c) => <span key={c} className="mx-auto h-9 w-9 rounded-2xl" style={{ background: c }} />)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Chips value={view} options={VIEWS} onChange={setView} label={t("มุมมอง")} />
            <Chips value={tag} options={TAGS} onChange={setTag} label={t("รูปแบบแท็ก")} />
            <ul className="space-y-2.5 text-sm text-slate-600">
              {POINTS.map((p) => (
                <li key={p} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />{t(p)}</li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/download" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700">
                <Icon name="download" className="h-4 w-4" /> {t("ดาวน์โหลดแอป Android")}
              </Link>
              <span className="text-xs text-slate-400">{t("ใช้ได้กับ Android")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
