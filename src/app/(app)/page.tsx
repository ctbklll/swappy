"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetch } from "@/lib/client";
import { addDays, displayYear, fmt, hours, parse, range, shortDate, today, DAYS, MONTHS, MONTHS_SHORT } from "@/lib/dates";
import type { PublicUser, Shift, ShiftTemplate } from "@/lib/types";
import { useApp } from "@/components/AppProvider";
import { useT } from "@/components/LangProvider";
import { AssignShiftModal } from "@/components/AssignShiftModal";
import { TemplatesModal } from "@/components/TemplatesModal";
import { refreshEvent } from "@/components/Shell";
import { Avatar, Dropdown, Empty, Icon, ShiftTag, card } from "@/components/ui";

type View = "month" | "two-weeks" | "week" | "list";
const VIEWS: { id: View; label: string }[] = [
  { id: "month", label: "เดือน" },
  { id: "two-weeks", label: "2 สัปดาห์" },
  { id: "week", label: "สัปดาห์" },
  { id: "list", label: "รายการ" },
];

export default function Dashboard() {
  const { user } = useApp();
  const { t, lang } = useT();
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [viewing, setViewing] = useState<string>(user.id);
  const [picker, setPicker] = useState(false);
  const [pickYear, setPickYear] = useState(anchor.getFullYear());
  const [tplOpen, setTplOpen] = useState(false);
  const [assign, setAssign] = useState<{ open: boolean; date?: string }>({ open: false });

  const days = useMemo(() => range(anchor, view), [anchor, view]);
  const from = fmt(days[0]);
  const to = fmt(days[days.length - 1]);
  const { data, reload } = useFetch<{ shifts: Shift[]; templates: ShiftTemplate[] }>(
    `/api/shifts?from=${from}&to=${to}&userId=${viewing}`, { poll: 15000 });
  const friends = useFetch<{ friends: { user: PublicUser }[] }>("/api/friends");

  useEffect(() => {
    const h = () => void reload();
    window.addEventListener(refreshEvent, h);
    return () => window.removeEventListener(refreshEvent, h);
  }, [reload]);

  const tplMap = useMemo(() => new Map((data?.templates ?? []).map((t) => [t.id, t])), [data]);
  const byDate = useMemo(() => {
    const m = new Map<string, ShiftTemplate>();
    for (const s of data?.shifts ?? []) { const t = tplMap.get(s.templateId); if (t) m.set(s.date, t); }
    return m;
  }, [data, tplMap]);

  const own = viewing === user.id;
  const style = user.tagStyle;
  const todayStr = today();

  const step = useCallback((dir: 1 | -1) => {
    setAnchor((a) => {
      if (view === "week") return addDays(a, 7 * dir);
      if (view === "two-weeks") return addDays(a, 14 * dir);
      return new Date(a.getFullYear(), a.getMonth() + dir, 1);
    });
  }, [view]);

  const title = view === "week" || view === "two-weeks"
    ? `${days[0].getDate()} ${MONTHS_SHORT[lang][days[0].getMonth()]} – ${days[days.length - 1].getDate()} ${MONTHS_SHORT[lang][days[days.length - 1].getMonth()]} ${displayYear(days[days.length - 1].getFullYear(), lang)}`
    : `${MONTHS[lang][anchor.getMonth()]} ${displayYear(anchor.getFullYear(), lang)}`;

  /* ---- stats over visible period ---- */
  const stats = useMemo(() => {
    const inPeriod = [...byDate.entries()].filter(([d]) => view === "month" || view === "list" ? parse(d).getMonth() === anchor.getMonth() : true);
    const perTpl = new Map<string, number>();
    let hrs = 0;
    for (const [, t] of inPeriod) { perTpl.set(t.id, (perTpl.get(t.id) ?? 0) + 1); hrs += hours(t.start, t.end); }
    const upcoming = [...byDate.entries()].filter(([d]) => d >= todayStr).sort(([a], [b]) => a.localeCompare(b))[0];
    return { total: inPeriod.length, hrs, perTpl, upcoming, off: days.filter((d) => (view !== "month" && view !== "list") || d.getMonth() === anchor.getMonth()).length - inPeriod.length };
  }, [byDate, view, anchor, days, todayStr]);

  const open = (d: string) => own && setAssign({ open: true, date: d });

  const Cell = ({ d, muted }: { d: Date; muted?: boolean }) => {
    const s = fmt(d);
    const tp = byDate.get(s);
    const isToday = s === todayStr;
    return (
      <button onClick={() => open(s)} disabled={!own}
        className={`group flex min-h-[4.25rem] flex-col items-stretch gap-1 rounded-2xl p-1.5 text-left transition md:min-h-24 md:p-2 ${muted ? "opacity-35" : ""} ${isToday ? "bg-blue-50 ring-2 ring-blue-600" : "bg-white ring-1 ring-slate-100"} ${own ? "hover:ring-blue-300" : "cursor-default"}`}>
        <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${isToday ? "bg-blue-600 text-white" : "text-slate-600"}`}>{d.getDate()}</span>
        {tp && <span className={style === "letter" ? "flex justify-center" : ""}><ShiftTag tpl={tp} style={style} compact /></span>}
      </button>
    );
  };

  const Row = ({ d }: { d: Date }) => {
    const s = fmt(d);
    const tp = byDate.get(s);
    const isToday = s === todayStr;
    return (
      <button onClick={() => open(s)} disabled={!own}
        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${isToday ? "bg-blue-50 ring-2 ring-blue-600" : "bg-white ring-1 ring-slate-100"}`}>
        <div className="w-12 text-center">
          <p className="text-[11px] font-medium text-slate-400">{DAYS[lang][d.getDay()]}</p>
          <p className={`text-xl font-bold ${isToday ? "text-blue-600" : "text-slate-800"}`}>{d.getDate()}</p>
        </div>
        {tp ? (
          <div className="flex flex-1 items-center gap-3 rounded-xl p-2" style={{ background: tp.color + "18" }}>
            <span className="h-9 w-1.5 rounded-full" style={{ background: tp.color }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: tp.color }}>{tp.name}</p>
              <p className="text-xs text-slate-500">{tp.start} - {tp.end}</p>
            </div>
          </div>
        ) : <p className="flex-1 px-2 text-sm text-slate-300">{t("วันหยุด / ไม่มีเวร")}</p>}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* Title row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{t("สวัสดี, {name}", { name: user.name })} 👋</p>
          <h1 className="text-2xl font-extrabold tracking-tight">{own ? t("ตารางเวรของฉัน") : t("ตารางเวร")}</h1>
        </div>
        <div className="flex items-center gap-2">
          {friends.data && friends.data.friends.length > 0 && (
            <Dropdown size="sm" className="min-w-40" ariaLabel={t("เลือกตารางที่ต้องการดู")} value={viewing} onChange={setViewing}
              options={[{ value: user.id, label: t("ตารางของฉัน") }, ...friends.data.friends.map((f) => ({ value: f.user.id, label: f.user.name }))]} />
          )}
          {own && (
            <button onClick={() => setTplOpen(true)} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50">
              {t("จัดการกะ")}
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label={t("สรุปสถิติกะงาน")}>
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white shadow-lg shadow-blue-600/25">
          <p className="text-xs opacity-80">{t("เวรทั้งหมด")}</p>
          <p className="mt-1 text-3xl font-extrabold">{stats.total}<span className="ml-1 text-sm font-medium opacity-80">{t("กะ")}</span></p>
        </div>
        <div className={card + " !p-4"}>
          <p className="text-xs text-slate-500">{t("ชั่วโมงทำงาน")}</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{stats.hrs}<span className="ml-1 text-sm font-medium text-slate-400">{t("ชม.")}</span></p>
        </div>
        <div className={card + " !p-4"}>
          <p className="text-xs text-slate-500">{t("วันหยุด")}</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{Math.max(stats.off, 0)}<span className="ml-1 text-sm font-medium text-slate-400">{t("วัน")}</span></p>
        </div>
        <div className={card + " !p-4"}>
          <p className="text-xs text-slate-500">{t("เวรถัดไป")}</p>
          {stats.upcoming ? (
            <>
              <p className="mt-1 text-lg font-bold" style={{ color: stats.upcoming[1].color }}>{stats.upcoming[1].name}</p>
              <p className="text-xs text-slate-500">{shortDate(stats.upcoming[0], lang)} · {stats.upcoming[1].start}</p>
            </>
          ) : <p className="mt-2 text-sm text-slate-400">{t("ไม่มี")}</p>}
        </div>
        {stats.perTpl.size > 0 && (
          <div className={`${card} !p-4 col-span-2 md:col-span-4`}>
            <p className="mb-2 text-xs text-slate-500">{t("สัดส่วนกะ")}</p>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              {[...stats.perTpl.entries()].map(([id, n]) => (
                <div key={id} style={{ width: `${(n / stats.total) * 100}%`, background: tplMap.get(id)?.color }} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              {[...stats.perTpl.entries()].map(([id, n]) => (
                <span key={id} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: tplMap.get(id)?.color }} />
                  {tplMap.get(id)?.name} <b>{n}</b>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex items-center gap-1">
          <button onClick={() => step(-1)} aria-label={t("ก่อนหน้า")} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200 hover:bg-slate-50"><Icon name="left" className="h-4 w-4" /></button>
          <button onClick={() => { setPickYear(anchor.getFullYear()); setPicker((p) => !p); }}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-slate-200 hover:bg-slate-50">
            {title} <Icon name="down" className="h-4 w-4 text-slate-400" />
          </button>
          <button onClick={() => step(1)} aria-label={t("ถัดไป")} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200 hover:bg-slate-50"><Icon name="right" className="h-4 w-4" /></button>
          <button onClick={() => setAnchor(new Date())} className="ml-1 rounded-full px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">{t("วันนี้")}</button>

          {picker && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setPicker(false)} />
              <div className="absolute left-0 top-12 z-30 w-72 rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
                <div className="mb-3 flex items-center justify-between">
                  <button onClick={() => setPickYear((y) => y - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100"><Icon name="left" className="h-4 w-4" /></button>
                  <b>{displayYear(pickYear, lang)}</b>
                  <button onClick={() => setPickYear((y) => y + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100"><Icon name="right" className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS_SHORT[lang].map((m, i) => {
                    const sel = pickYear === anchor.getFullYear() && i === anchor.getMonth();
                    return (
                      <button key={m} onClick={() => { setAnchor(new Date(pickYear, i, 1)); setPicker(false); }}
                        className={`rounded-xl py-2 text-sm font-semibold ${sel ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50"}`}>{m}</button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex rounded-full bg-slate-200/70 p-1 text-sm font-semibold" role="tablist">
          {VIEWS.map((v) => (
            <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}
              className={`rounded-full px-3.5 py-1.5 transition ${view === v.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>{t(v.label)}</button>
          ))}
        </div>
      </div>

      {!own && friends.data && (
        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-3 text-sm text-blue-800">
          <Avatar user={friends.data.friends.find((f) => f.user.id === viewing)!.user} size={28} />
          {t("กำลังดูตารางของ {name} (อ่านอย่างเดียว)", { name: friends.data.friends.find((f) => f.user.id === viewing)?.user.name ?? "" })}
        </div>
      )}

      {/* Calendar */}
      {view === "list" ? (
        <div className="space-y-2">
          {days.filter((d) => byDate.has(fmt(d))).map((d) => <Row key={fmt(d)} d={d} />)}
          {!stats.total && <Empty icon="cal" text={t("ไม่มีเวรในเดือนนี้")} />}
        </div>
      ) : (
        <>
          <div className={view === "month" ? "" : "hidden md:block"}>
            <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-400">
              {DAYS[lang].map((d, i) => <div key={d} className={i === 0 ? "text-rose-400" : ""}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
              {days.map((d) => <Cell key={fmt(d)} d={d} muted={view === "month" && d.getMonth() !== anchor.getMonth()} />)}
            </div>
          </div>
          {view !== "month" && (
            <div className="space-y-2 md:hidden">
              {days.map((d) => <Row key={fmt(d)} d={d} />)}
            </div>
          )}
        </>
      )}

      <TemplatesModal open={tplOpen} onClose={() => setTplOpen(false)} onChanged={() => void reload()} />
      <AssignShiftModal open={assign.open} initialDate={assign.date} onClose={() => setAssign({ open: false })} onDone={() => void reload()} />
    </div>
  );
}
