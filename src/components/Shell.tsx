"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AddFriendModal } from "./AddFriendModal";
import { AssignShiftModal } from "./AssignShiftModal";
import { useApp } from "./AppProvider";
import { useT } from "./LangProvider";
import { Avatar, Icon, type IconName } from "./ui";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "หน้าแรก", icon: "home" },
  { href: "/friends", label: "เพื่อน", icon: "users" },
  { href: "/swaps", label: "แลกเวร", icon: "swap" },
  { href: "/notifications", label: "แจ้งเตือน", icon: "bell" },
  { href: "/settings", label: "ตั้งค่า", icon: "cog" },
];

export const refreshEvent = "swappy:refresh";
export const refresh = () => window.dispatchEvent(new Event(refreshEvent));

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, unread, sheetOpen, setSheetOpen } = useApp();
  const { t } = useT();
  const [friendOpen, setFriendOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  const badge =
    unread > 0 ? (
      <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
        {unread > 9 ? "9+" : unread}
      </span>
    ) : null;

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden border-b border-slate-200/70 bg-white/80 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Swappy" width={36} height={36} className="rounded-xl" priority />
            <span className="text-lg font-extrabold tracking-tight text-blue-700">Swappy</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1">
            {NAV.slice(0, 3).map((n) => (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${active(n.href) ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}>
                <Icon name={n.icon} className="h-4 w-4" /> {t(n.label)}
              </Link>
            ))}
            {user.role === "admin" && (
              <Link href="/admin" className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${active("/admin") ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}>
                <Icon name="shield" className="h-4 w-4" /> {t("ผู้ดูแล")}
              </Link>
            )}
          </nav>
          <button onClick={() => setSheetOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700">
            <Icon name="plus" className="h-4 w-4" /> {t("เพิ่ม")}
          </button>
          <Link href="/notifications" aria-label={t("แจ้งเตือน")} className={`relative grid h-10 w-10 place-items-center rounded-xl ${active("/notifications") ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}>
            <Icon name="bell" /> {badge}
          </Link>
          <Link href="/settings" aria-label={t("ตั้งค่า")} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-slate-100">
            <Avatar user={user} size={34} />
            <span className="max-w-32 truncate text-sm font-semibold text-slate-700">{user.name}</span>
          </Link>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-50/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Swappy" width={32} height={32} className="rounded-xl" priority />
          <span className="text-lg font-extrabold tracking-tight text-blue-700">Swappy</span>
        </Link>
        <Link href="/settings"><Avatar user={user} size={34} /></Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-2 md:px-6 md:pb-12 md:pt-8">{children}</main>

      {/* Floating pill bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:hidden" aria-label={t("เมนูหลัก")}>
        <div className="flex w-full max-w-sm items-center justify-between rounded-full border border-white/60 bg-white/70 px-3 py-2 shadow-xl shadow-blue-900/15 ring-1 ring-slate-200/60 backdrop-blur-2xl">
          {[NAV[0], NAV[1]].map((n) => (
            <Link key={n.href} href={n.href} aria-label={t(n.label)}
              className={`grid h-11 w-11 place-items-center rounded-full transition ${active(n.href) ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}>
              <Icon name={n.icon} className="h-6 w-6" />
            </Link>
          ))}
          <button onClick={() => setSheetOpen(true)} aria-label={t("เพิ่ม")}
            className="-my-4 grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-4 ring-white/80 transition active:scale-95">
            <Icon name="plus" className="h-7 w-7" strokeWidth={2.5} />
          </button>
          {[NAV[3], NAV[4]].map((n) => (
            <Link key={n.href} href={n.href} aria-label={t(n.label)}
              className={`relative grid h-11 w-11 place-items-center rounded-full transition ${active(n.href) ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}>
              <Icon name={n.icon} className="h-6 w-6" />
              {n.href === "/notifications" && badge}
            </Link>
          ))}
        </div>
      </nav>

      {/* "+" action sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
          <div className="relative w-full space-y-2 rounded-t-[2rem] bg-white p-5 pb-8 shadow-2xl sm:max-w-sm sm:rounded-[2rem]">
            <h2 className="mb-2 text-lg font-bold">{t("ต้องการทำอะไร?")}</h2>
            {[
              { t: "เพิ่มเวร", d: "กำหนดกะงานในปฏิทินของคุณ", i: "cal" as const, a: () => setShiftOpen(true) },
              { t: "เพิ่มเพื่อน", d: "สแกน QR หรือกรอกรหัสส่วนตัว", i: "qr" as const, a: () => setFriendOpen(true) },
              { t: "ขอแลกเวร", d: "สลับวันและเวลากับเพื่อนร่วมงาน", i: "swap" as const, a: () => router.push("/swaps?new=1") },
            ].map((x) => (
              <button key={x.t} onClick={() => { setSheetOpen(false); x.a(); }}
                className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-blue-50">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white"><Icon name={x.i} /></span>
                <span>
                  <span className="block font-semibold">{t(x.t)}</span>
                  <span className="text-xs text-slate-500">{t(x.d)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <AddFriendModal open={friendOpen} onClose={() => setFriendOpen(false)} onDone={refresh} />
      <AssignShiftModal open={shiftOpen} onClose={() => setShiftOpen(false)} onDone={refresh} />
    </div>
  );
}
