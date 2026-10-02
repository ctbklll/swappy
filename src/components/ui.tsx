"use client";
import { useEffect } from "react";
import { useT } from "./LangProvider";
import type { PublicUser, ShiftTemplate, TagStyle } from "@/lib/types";

/* ---------- icons ---------- */
const paths = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  users: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-12 9a8 8 0 0 1 16 0",
  plus: "M12 5v14M5 12h14",
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8Zm4.3 13a2 2 0 0 0 3.4 0",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.600 3h-4l-.4 2.700a7 7 0 0 0-2 1.200l-2.300-1-2 3.400 2 1.500a7.400 7.400 0 0 0 0 2.400l-2 1.500 2 3.400 2.300-1a7 7 0 0 0 2 1.200l.4 2.700h4l.4-2.700a7 7 0 0 0 2-1.200l2.300 1 2-3.400-2-1.500c.1-.4.1-.8.1-1.200Z",
  left: "m15 5-7 7 7 7",
  right: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  swap: "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4m4 4H7",
  x: "M6 6l12 12M18 6 6 18",
  check: "m5 12 5 5 9-10",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v3M14 20h3m3 0v0",
  shield: "M12 3 4 6v6c0 5 3.500 8 8 9 4.500-1 8-4 8-9V6z",
  logout: "M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  cal: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  copy: "M9 9h10v11H9zM5 15V4h10",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7Z",
} as const;
export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-5 w-5", strokeWidth = 2 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}

/* ---------- shared class strings ---------- */
export const btn = {
  primary: "inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50",
  ghost: "inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50",
  danger: "inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-[0.98] disabled:opacity-50",
};
export const input =
  "w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600";
export const card = "rounded-3xl bg-white p-5 shadow-sm shadow-slate-900/5 ring-1 ring-slate-100";

/* ---------- avatar ---------- */
export function Avatar({ user, size = 40 }: { user: Pick<PublicUser, "name" | "avatar">; size?: number }) {
  if (user.avatar)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt={user.name} width={size} height={size} style={{ width: size, height: size }}
      className="rounded-full object-cover ring-2 ring-white" />;
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 font-semibold text-white ring-2 ring-white">
      {user.name.trim().charAt(0).toUpperCase()}
    </div>
  );
}

/* ---------- modal / bottom sheet ---------- */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const { t } = useT();
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label={t("ปิด")} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- shift tag (Bar / Dot / Block / Letter) ---------- */
export function ShiftTag({ tpl, style, compact = false }: { tpl: Pick<ShiftTemplate, "name" | "color" | "start" | "end">; style: TagStyle; compact?: boolean }) {
  const c = tpl.color;
  const time = `${tpl.start}-${tpl.end}`;
  switch (style) {
    case "dot":
      return (
        <span className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-slate-700" title={`${tpl.name} ${time}`}>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
          <span className="truncate">{tpl.name}</span>
        </span>
      );
    case "block":
      return (
        <span className="block truncate rounded-lg px-1.5 py-1 text-[11px] font-semibold text-white" style={{ background: c }} title={`${tpl.name} ${time}`}>
          {tpl.name}{!compact && <span className="ml-1 hidden font-normal opacity-90 sm:inline">{time}</span>}
        </span>
      );
    case "letter":
      return (
        <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: c }} title={`${tpl.name} ${time}`}>
          {tpl.name.charAt(0)}
        </span>
      );
    default:
      return (
        <span className="flex min-w-0 items-stretch gap-1 rounded-md bg-slate-50 pr-1 text-[11px] font-medium text-slate-700" title={`${tpl.name} ${time}`}>
          <span className="w-1 shrink-0 rounded-full" style={{ background: c }} />
          <span className="truncate py-0.5">{tpl.name}</span>
        </span>
      );
  }
}

export function Empty({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white/60 py-10 text-slate-400">
      <Icon name={icon} className="h-8 w-8" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
