"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { api } from "@/lib/client";
import type { PublicUser, TagStyle } from "@/lib/types";
import { useApp } from "@/components/AppProvider";
import { LangSwitch, useT } from "@/components/LangProvider";
import { TemplatesModal } from "@/components/TemplatesModal";
import { Avatar, Icon, ShiftTag, btn, card, input } from "@/components/ui";

const STYLES: { id: TagStyle; label: string }[] = [
  { id: "bar", label: "Bar" }, { id: "dot", label: "Dot" }, { id: "block", label: "Block" }, { id: "letter", label: "Letter" },
];

/** Resize to <=256px JPEG data URL so avatars stay small. */
function toAvatar(file: File, errMsg: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(256 / img.width, 256 / img.height, 1);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error(errMsg));
    img.src = URL.createObjectURL(file);
  });
}

/** Card with a chevron header that collapses / expands its content. */
function Section({ title, subtitle, defaultOpen = false, children }: {
  title: string; subtitle?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { t } = useT();
  return (
    <section className={card}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left">
        <span>
          <span className="block font-bold">{title}</span>
          {subtitle && <span className="block text-xs text-slate-500">{subtitle}</span>}
        </span>
        <span aria-label={open ? t("ย่อ") : t("ขยาย")}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
          <Icon name="down" className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </section>
  );
}

export default function Settings() {
  const { user, setUser, toast, logout } = useApp();
  const { t, ts } = useT();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const [tplOpen, setTplOpen] = useState(false);

  const patch = async (data: Record<string, unknown>, msg = t("บันทึกแล้ว")) => {
    try {
      const r = await api<{ user: PublicUser }>("/api/me", "PATCH", data);
      setUser(r.user);
      toast(msg);
      return true;
    } catch (e) { toast(ts((e as Error).message), "error"); return false; }
  };

  const sample = { name: t("เช้า"), color: "#2563eb", start: "08:00", end: "16:00" };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("ตั้งค่า")}</h1>

      <Section title={t("โปรไฟล์")}>
        <div className="flex items-center gap-4">
          <Avatar user={user} size={72} />
          <div className="flex flex-wrap gap-2">
            <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) { try { await patch({ avatar: await toAvatar(f, t("ไม่สามารถอ่านรูปภาพได้")) }, t("อัปเดตรูปโปรไฟล์แล้ว")); } catch (er) { toast((er as Error).message, "error"); } }
                e.target.value = "";
              }} />
            <button className={btn.ghost} onClick={() => file.current?.click()}>{t("อัปโหลดรูป")}</button>
            {user.avatar && <button className={btn.danger} onClick={() => patch({ avatar: null }, t("ลบรูปแล้ว"))}>{t("ลบรูป")}</button>}
          </div>
        </div>
        <label className="block space-y-1 text-xs font-semibold text-slate-500">{t("ชื่อ")}
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block space-y-1 text-xs font-semibold text-slate-500">{t("อีเมล")}
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button className={btn.primary} onClick={() => patch({ name, email })}>{t("บันทึกโปรไฟล์")}</button>
        <p className="text-xs text-slate-400">{t("รหัสส่วนตัว")}: <span className="font-mono font-bold text-blue-700">{user.code}</span></p>
      </Section>

      <section className={`${card} flex items-center justify-between gap-3`}>
        <div>
          <h2 className="font-bold">{t("ภาษา")} / Language</h2>
          <p className="text-xs text-slate-500">{t("เลือกภาษาที่ใช้แสดงผล")}</p>
        </div>
        <LangSwitch />
      </section>

      <Section title={t("รูปแบบแท็กกะงานในปฏิทิน")} subtitle={t("เลือกวิธีแสดงกะงานในแต่ละวัน")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STYLES.map((s) => (
            <button key={s.id} onClick={() => patch({ tagStyle: s.id }, t("ใช้รูปแบบ {name}", { name: s.label }))}
              className={`flex flex-col items-center gap-3 rounded-2xl p-4 ring-1 transition ${user.tagStyle === s.id ? "bg-blue-50 ring-2 ring-blue-600" : "bg-white ring-slate-200 hover:bg-slate-50"}`}>
              <div className="flex h-8 w-full items-center justify-center"><ShiftTag tpl={sample} style={s.id} compact /></div>
              <span className="text-sm font-semibold">{s.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <section className={`${card} flex items-center gap-3`}>
        <div className="flex-1">
          <h2 className="font-bold">{t("กะงานของฉัน")}</h2>
          <p className="text-xs text-slate-500">{t("เพิ่ม แก้ไข หรือลบกะ (ชื่อ เวลา สี)")}</p>
        </div>
        <button className={btn.primary} onClick={() => setTplOpen(true)}>{t("จัดการกะ")}</button>
      </section>
      <TemplatesModal open={tplOpen} onClose={() => setTplOpen(false)} onChanged={() => {}} />

      <Section title={t("เปลี่ยนรหัสผ่าน")}>
        <input className={input} type="password" placeholder={t("รหัสผ่านปัจจุบัน")} value={cur} onChange={(e) => setCur(e.target.value)} />
        <input className={input} type="password" placeholder={t("รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)")} value={next} onChange={(e) => setNext(e.target.value)} />
        <button className={btn.ghost} disabled={!cur || !next} onClick={async () => { if (await patch({ currentPassword: cur, newPassword: next }, t("เปลี่ยนรหัสผ่านแล้ว"))) { setCur(""); setNext(""); } }}>{t("เปลี่ยนรหัสผ่าน")}</button>
      </Section>

      {user.role === "admin" && (
        <Link href="/admin" className={`${card} flex items-center gap-3 transition hover:bg-blue-50`}>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white"><Icon name="shield" /></span>
          <span className="flex-1"><b className="block">{t("โหมดผู้ดูแลระบบ")}</b><span className="text-xs text-slate-500">{t("จัดการผู้ใช้และดูสถิติของระบบ")}</span></span>
          <Icon name="right" className="h-4 w-4 text-slate-400" />
        </Link>
      )}

      <button onClick={logout} className={`${btn.danger} w-full`}><Icon name="logout" className="h-4 w-4" /> {t("ออกจากระบบ")}</button>
    </div>
  );
}
