"use client";
import Image from "next/image";
import Link from "next/link";
import { LangSwitch, useT } from "@/components/LangProvider";

/** Header shared by the landing page and the download page. */
export function LandingHeader({ active }: { active?: "download" }) {
  const { t } = useT();
  // on the landing page anchors scroll in place; from other pages they jump back to it
  const base = active ? "/welcome" : "";
  return (
    <>
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Swappy" width={36} height={36} className="rounded-xl" priority />
          <span className="text-lg font-extrabold tracking-tight text-blue-700">Swappy</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-500 md:flex">
          <a href={`${base}#features`} className="hover:text-blue-600">{t("ฟีเจอร์")}</a>
          <a href={`${base}#how`} className="hover:text-blue-600">{t("วิธีใช้งาน")}</a>
          <a href={`${base}#widget`} className="hover:text-blue-600">{t("วิดเจ็ต")}</a>
            <a href={`${base}#styles`} className="hover:text-blue-600">{t("รูปแบบแท็ก")}</a>
          <Link href="/download" className={`font-bold ${active === "download" ? "text-blue-700" : "text-blue-600 hover:text-blue-700"}`}>{t("ดาวน์โหลด")}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch />
          <Link href="/login" className="hidden rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:block">{t("เข้าสู่ระบบ")}</Link>
          <Link href="/register" className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700">{t("เริ่มต้นใช้งาน")}</Link>
        </div>
      </div>
    </header>
    </>
  );
}
