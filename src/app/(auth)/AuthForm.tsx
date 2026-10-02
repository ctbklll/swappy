"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { LangSwitch, useT } from "@/components/LangProvider";
import { btn, input } from "@/components/ui";

function PasswordInput({ value, onChange, placeholder, autoComplete }: {
  value: string; onChange: (v: string) => void; placeholder: string; autoComplete: string;
}) {
  const { t } = useT();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input className={`${input} pr-12`} type={show ? "text" : "password"} placeholder={placeholder}
        autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} required />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? t("ซ่อนรหัสผ่าน") : t("แสดงรหัสผ่าน")}
        aria-pressed={show}
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
          {show ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 8.5 4 9.5 6a12.8 12.8 0 0 1-2.6 3.3M6.6 6.7A12.8 12.8 0 0 0 2.5 12c1 2 4.500 6 9.500 6 1.400 0 2.700-.3 3.800-.8" />
              <path d="M9.900 9.900a3 3 0 0 0 4.200 4.200" />
            </>
          ) : (
            <>
              <path d="M2.500 12c1-2 4.500-6 9.500-6s8.500 4 9.500 6c-1 2-4.500 6-9.500 6s-8.500-4-9.500-6Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { t, ts } = useT();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const reg = mode === "register";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (reg && f.password !== f.confirm) return setErr(t("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน"));
    setBusy(true);
    try {
      await api(`/api/auth/${mode}`, "POST", f);
      router.replace("/");
    } catch (er) {
      setErr(ts((er as Error).message));
      setBusy(false);
    }
  };

  return (
    <main className="relative grid min-h-dvh place-items-center bg-gradient-to-b from-blue-50 to-slate-50 p-4">
      <div className="absolute right-4 top-4"><LangSwitch /></div>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Link href="/"><Image src="/logo.png" alt="Swappy" width={96} height={96} priority className="rounded-[1.75rem] shadow-xl shadow-blue-600/25" /></Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-blue-700">Swappy</h1>
            <p className="text-sm text-slate-500">{t("จัดการตารางเวรและแลกเวรกับเพื่อนร่วมงาน")}</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3 rounded-[2rem] bg-white p-6 shadow-xl shadow-blue-900/5 ring-1 ring-slate-100">
          <h2 className="text-lg font-bold">{reg ? t("สร้างบัญชีใหม่") : t("เข้าสู่ระบบ")}</h2>
          {reg && <input className={input} placeholder={t("ชื่อ-นามสกุล")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />}
          <input className={input} type="email" placeholder={t("อีเมล")} autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          <PasswordInput placeholder={t("รหัสผ่าน")} autoComplete={reg ? "new-password" : "current-password"} value={f.password} onChange={(v) => setF({ ...f, password: v })} />
          {reg && <PasswordInput placeholder={t("ยืนยันรหัสผ่าน")} autoComplete="new-password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} />}
          {reg && f.confirm && f.password !== f.confirm && <p className="px-1 text-xs text-rose-500">{t("รหัสผ่านไม่ตรงกัน")}</p>}
          {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600" role="alert">{err}</p>}
          <button disabled={busy} className={`${btn.primary} w-full`}>{reg ? t("ลงทะเบียน") : t("เข้าสู่ระบบ")}</button>
          <p className="pt-1 text-center text-sm text-slate-500">
            {reg ? t("มีบัญชีอยู่แล้ว?") : t("ยังไม่มีบัญชี?")}{" "}
            <Link className="font-semibold text-blue-600" href={reg ? "/login" : "/register"}>{reg ? t("เข้าสู่ระบบ") : t("ลงทะเบียน")}</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
