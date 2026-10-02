"use client";
import { DAYS, MONTHS, displayYear } from "@/lib/dates";
import { useT } from "./LangProvider";

export type MockView = "list" | "month" | "two-weeks" | "week";
export type MockTag = "bar" | "dot" | "block" | "letter";

// short names so they fit the small calendar cells in both languages
const KINDS = [
  { name: { th: "เช้า", en: "Day" }, time: "08:00", color: "#2563eb" },
  { name: { th: "บ่าย", en: "Eve" }, time: "16:00", color: "#f59e0b" },
  { name: { th: "ดึก", en: "Ngt" }, time: "00:00", color: "#7c3aed" },
] as const;

/** Sample roster for October 2026 (grid starts Sunday 27 Sep). Day-offs where `i % 4 === 3`. */
const START = new Date(2026, 8, 27);
const TODAY_INDEX = 13; // 10 Oct
const cells = Array.from({ length: 35 }, (_, i) => {
  const d = new Date(START.getFullYear(), START.getMonth(), START.getDate() + i);
  const off = i < 5 || i % 4 === 3;
  return { i, date: d, day: d.getDate(), inMonth: d.getMonth() === 9, shift: off ? null : KINDS[i % 3] };
});

function Tag({ kind, tag, size = 10 }: { kind: (typeof KINDS)[number]; tag: MockTag; size?: number }) {
  const { lang } = useT();
  const name = kind.name[lang];
  const fs = { fontSize: size };
  switch (tag) {
    case "dot":
      return (
        <span className="flex items-center gap-1" style={fs}>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: kind.color }} />
          <span className="overflow-hidden whitespace-nowrap text-slate-800">{name}</span>
        </span>
      );
    case "block":
      return <span className="block overflow-hidden whitespace-nowrap rounded-md px-1 py-px font-bold text-white" style={{ ...fs, background: kind.color }}>{name}</span>;
    case "letter":
      return (
        <span className="grid h-[18px] w-[18px] place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: kind.color }}>
          {name.charAt(0)}
        </span>
      );
    default:
      return (
        <span className="flex items-stretch gap-1 rounded bg-slate-100 pr-1" style={fs}>
          <span className="w-[3px] shrink-0 rounded-full" style={{ background: kind.color }} />
          <span className="overflow-hidden whitespace-nowrap py-px text-slate-800">{name}</span>
        </span>
      );
  }
}

function Grid({ view, tag }: { view: Exclude<MockView, "list">; tag: MockTag }) {
  const { lang } = useT();
  // week / two-weeks start on the week that contains "today"
  const startRow = view === "month" ? 0 : Math.floor(TODAY_INDEX / 7);
  const rows = view === "month" ? 5 : view === "two-weeks" ? 2 : 1;
  const list = cells.slice(startRow * 7, (startRow + rows) * 7);
  const roomy = view !== "month";
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0.5">
      <div className="grid grid-cols-7 text-center text-[9px] font-bold text-slate-400">
        {DAYS[lang].map((d, i) => <span key={d} className={i === 0 ? "text-rose-400" : ""}>{d}</span>)}
      </div>
      <div className="grid flex-1 grid-cols-7 gap-[3px]" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {list.map((c) => {
          const today = c.i === TODAY_INDEX;
          return (
            <div key={c.i} className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg p-0.5 ${today ? "bg-blue-100" : "bg-slate-50"} ${view === "week" ? "py-2" : ""}`}>
              <span className={`text-[10px] ${today ? "font-bold text-blue-600" : c.inMonth ? "font-semibold text-slate-600" : "text-slate-300"}`}>{c.day}</span>
              {c.shift && <div className="w-full min-w-0 px-0.5"><div className="flex justify-center"><Tag kind={c.shift} tag={tag} size={9} /></div></div>}
              {roomy && c.shift && <span className="text-[8px] text-slate-400">{c.shift.time}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ tag }: { tag: MockTag }) {
  const { t, lang } = useT();
  const today = cells[TODAY_INDEX].shift ?? KINDS[0];
  const next = cells.slice(TODAY_INDEX + 1).filter((c) => c.shift).slice(0, 3);
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <div className="flex items-center gap-2.5 rounded-2xl bg-blue-50 p-2">
        <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: today.color }} />
        <div>
          <p className="text-[15px] font-extrabold leading-tight text-slate-900">{t("วันนี้")} · {today.name[lang]}</p>
          <p className="text-[11px] text-slate-500">{today.time}</p>
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-400">{t("เวรถัดไป")}</p>
      {next.map((c) => (
        <div key={c.i} className="flex items-center gap-2 text-[11px]">
          <span className="w-16 shrink-0 font-semibold text-slate-800">{DAYS[lang][c.date.getDay()]} {c.day}</span>
          <Tag kind={c.shift!} tag={tag} size={11} />
          <span className="text-[10px] text-slate-400">{c.shift!.time}</span>
        </div>
      ))}
    </div>
  );
}

/** HTML replica of the Android home-screen widget, used on the landing page. */
export function WidgetMock({ view, tag, className = "" }: { view: MockView; tag: MockTag; className?: string }) {
  const { lang } = useT();
  const title = view === "month" || view === "list"
    ? `${MONTHS[lang][9]} ${displayYear(2026, lang)}`
    : view === "week" ? (lang === "th" ? "4 – 10 ต.ค." : "Oct 4 – 10") : (lang === "th" ? "4 – 17 ต.ค." : "Oct 4 – 17");
  const height = view === "month" ? "h-[270px]" : view === "list" ? "h-[200px]" : view === "week" ? "h-[150px]" : "h-[190px]";
  return (
    <div className={`flex w-full flex-col gap-1.5 rounded-[1.6rem] bg-white p-3 shadow-xl shadow-slate-900/25 ring-1 ring-white/60 ${height} ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-extrabold text-blue-600">Swappy</span>
        <span className="text-[12px] font-semibold text-slate-500">{title}</span>
      </div>
      {view === "list" ? <ListView tag={tag} /> : <Grid view={view} tag={tag} />}
    </div>
  );
}
