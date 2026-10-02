"use client";
import Image from "next/image";
import Link from "next/link";
import { LangSwitch, useT } from "@/components/LangProvider";
import { Icon, type IconName } from "@/components/ui";
import { DAYS, MONTHS, displayYear } from "@/lib/dates";
import releases from "@/data/releases.json";

type Release = (typeof releases)[number];
const RELEASES = releases as Release[];
const mb = (b: number) => `${(b / 1048576).toFixed(1)} MB`;

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "cal", title: "ปฏิทินเวร 4 มุมมอง", text: "ดูเป็นเดือน 2 สัปดาห์ สัปดาห์ หรือรายการ พร้อมสรุปจำนวนกะและชั่วโมงทำงาน" },
  { icon: "clock", title: "กะงานตามแบบของคุณ", text: "ตั้งชื่อกะ เวลาเริ่ม-สิ้นสุด และสีประจำกะ เพิ่ม แก้ไข หรือลบได้เอง" },
  { icon: "qr", title: "เพิ่มเพื่อนด้วย QR", text: "สแกน QR Code หรือกรอกรหัสส่วนตัว ส่งคำขอและตอบรับได้ทันที" },
  { icon: "swap", title: "แลกเวรง่ายๆ", text: "เลือกเวรของคุณกับเวรของเพื่อน ส่งคำขอ เพื่อนกดตอบรับ ตารางอัปเดตให้อัตโนมัติ" },
  { icon: "bell", title: "แจ้งเตือนทันที", text: "รู้ทันทีเมื่อมีคำขอเพื่อนหรือคำขอแลกเวร ไม่พลาดทุกความเคลื่อนไหว" },
  { icon: "shield", title: "โหมดผู้ดูแลระบบ", text: "แอดมินดูภาพรวมของระบบ จัดการผู้ใช้และสิทธิ์ได้จากที่เดียว" },
];

const STEPS = [
  { n: "1", title: "สร้างบัญชี", text: "ลงทะเบียนด้วยอีเมล ได้กะเริ่มต้น เช้า/บ่าย/ดึก ให้ทันที" },
  { n: "2", title: "ลงเวรของคุณ", text: "แตะวันที่ในปฏิทินแล้วเลือกกะ หรือเลือกเป็นช่วงหลายวัน" },
  { n: "3", title: "ชวนเพื่อนและแลกเวร", text: "สแกน QR เพิ่มเพื่อน แล้วขอแลกหรือยกเวรให้กันได้เลย" },
];

const MOCK: Record<number, [string, string]> = {
  2: ["เช้า", "#2563eb"], 3: ["เช้า", "#2563eb"], 4: ["บ่าย", "#f59e0b"], 6: ["บ่าย", "#f59e0b"],
  7: ["ดึก", "#7c3aed"], 9: ["ดึก", "#7c3aed"], 10: ["เช้า", "#2563eb"], 11: ["เช้า", "#2563eb"],
  13: ["บ่าย", "#f59e0b"], 14: ["บ่าย", "#f59e0b"], 16: ["ดึก", "#7c3aed"], 17: ["เช้า", "#2563eb"],
  18: ["เช้า", "#2563eb"], 20: ["บ่าย", "#f59e0b"], 21: ["ดึก", "#7c3aed"],
};

function CalendarMock() {
  const { t, lang } = useT();
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-blue-200/60 via-sky-100/50 to-transparent blur-2xl" />
      <div className="rounded-[2rem] bg-white p-5 shadow-2xl shadow-blue-900/10 ring-1 ring-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">{t("ตารางเวรของฉัน")}</p>
            <p className="text-lg font-extrabold">{MONTHS[lang][9]} {displayYear(2026, lang)}</p>
          </div>
          <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-[11px] font-semibold text-slate-500">
            <span className="rounded-full bg-white px-2.5 py-1 text-blue-700 shadow-sm">{t("เดือน")}</span>
            <span className="px-2 py-1">{t("สัปดาห์")}</span>
          </div>
        </div>
        <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400">
          {DAYS[lang].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => {
            const m = MOCK[d];
            return (
              <div key={d} className={`flex aspect-[4/5] flex-col gap-0.5 rounded-xl p-1 ${d === 10 ? "bg-blue-50 ring-2 ring-blue-600" : "bg-slate-50"}`}>
                <span className={`text-[10px] font-semibold ${d === 10 ? "text-blue-600" : "text-slate-500"}`}>{d}</span>
                {m && <span className="truncate rounded px-1 text-[9px] font-semibold text-white" style={{ background: m[1] }}>{t(m[0])}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl shadow-blue-900/10 ring-1 ring-slate-100 sm:-left-8">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><Icon name="swap" className="h-5 w-5" /></span>
        <div>
          <p className="text-xs font-bold">{t("คำขอแลกเวร")}</p>
          <p className="text-[11px] text-slate-500">{t("มานี ขอแลกเวร 10 ต.ค.")}</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { t, lang } = useT();
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Swappy" width={36} height={36} className="rounded-xl" priority />
            <span className="text-lg font-extrabold tracking-tight text-blue-700">Swappy</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-500 md:flex">
            <a href="#features" className="hover:text-blue-600">{t("ฟีเจอร์")}</a>
            <a href="#how" className="hover:text-blue-600">{t("วิธีใช้งาน")}</a>
            <a href="#styles" className="hover:text-blue-600">{t("รูปแบบแท็ก")}</a>
            <a href="#download" className="font-bold text-blue-600 hover:text-blue-700">{t("ดาวน์โหลด")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <Link href="/login" className="hidden rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:block">{t("เข้าสู่ระบบ")}</Link>
            <Link href="/register" className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700">{t("เริ่มต้นใช้งาน")}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 md:grid-cols-2 md:px-6 md:pb-28 md:pt-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3.5 py-1.5 text-xs font-bold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> {t("สำหรับพนักงานปฏิบัติการ")}
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight md:text-5xl">
              {t("จัดตารางเวร")} <span className="text-blue-600">{t("แลกเวร")}</span><br />{t("จบในแอปเดียว")}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-slate-500">
              {t("Swappy ช่วยให้คุณเห็นตารางเวรทั้งเดือนในพริบตา ชวนเพื่อนร่วมงานด้วย QR Code และขอแลกเวรกันได้ง่ายๆ ไม่ต้องไล่ถามในกลุ่มแชทอีกต่อไป")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700">{t("สร้างบัญชีฟรี")}</Link>
              <Link href="/login" className="rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">{t("เข้าสู่ระบบ")}</Link>
              <a href="#download" className="rounded-2xl bg-blue-50 px-6 py-3.5 text-base font-semibold text-blue-700 transition hover:bg-blue-100">{t("ดาวน์โหลดแอป Android")}</a>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {["ใช้งานบนมือถือได้เต็มรูปแบบ", "ไม่ต้องติดตั้งแอป", "ข้อมูลเก็บบนคลาวด์"].map((x) => (
                <li key={x} className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-blue-600" /> {t(x)}</li>
              ))}
            </ul>
          </div>
          <CalendarMock />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-bold text-blue-600">{t("ฟีเจอร์")}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{t("ทุกอย่างที่ทีมปฏิบัติการต้องใช้")}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-900/5 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25"><Icon name={f.icon} /></span>
                <h3 className="mt-4 text-lg font-bold">{t(f.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{t(f.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-bold text-blue-600">{t("วิธีใช้งาน")}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{t("เริ่มต้นได้ใน 3 ขั้นตอน")}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-3xl bg-gradient-to-br from-blue-50 to-white p-6 ring-1 ring-blue-100">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-lg font-extrabold text-white">{s.n}</span>
                <h3 className="mt-4 text-lg font-bold">{t(s.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{t(s.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tag styles */}
      <section id="styles" className="scroll-mt-16 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-bold text-blue-600">{t("ปรับแต่งได้")}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{t("เลือกรูปแบบแท็กกะที่ชอบ")}</h2>
            <p className="mt-3 text-slate-500">{t("เปลี่ยนวิธีแสดงกะในปฏิทินได้ตลอดที่หน้าตั้งค่า")}</p>
          </div>
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { n: "Bar", el: <span className="flex items-stretch gap-1 rounded-md bg-slate-50 pr-2 text-xs font-medium"><span className="w-1 rounded-full bg-blue-600" /><span className="py-0.5">{t("เช้า")}</span></span> },
              { n: "Dot", el: <span className="flex items-center gap-1.5 text-xs font-medium"><span className="h-2 w-2 rounded-full bg-amber-500" />{t("บ่าย")}</span> },
              { n: "Block", el: <span className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white">{t("ดึก")}</span> },
              { n: "Letter", el: <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{t("เช้า").charAt(0)}</span> },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 ring-1 ring-slate-100">
                <div className="flex h-8 items-center">{s.el}</div>
                <span className="text-sm font-bold">{s.n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="scroll-mt-16 py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-bold text-blue-600">{t("ดาวน์โหลด")}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{t("ติดตั้ง Swappy บนมือถือ Android")}</h2>
            <p className="mt-3 text-slate-500">{t("ใช้ Swappy ได้ทั้งบนเว็บและแอป พร้อมวิดเจ็ตบนหน้าจอหลัก ดาวน์โหลดไฟล์ APK แล้วติดตั้งได้ทันที")}</p>
          </div>

          {RELEASES.some((r) => r.file) ? (
            <div className="space-y-4">
              {RELEASES.filter((r) => r.file).map((r, i) => (
                <div key={r.version} className={`rounded-3xl bg-white p-6 ring-1 ${i === 0 ? "shadow-xl shadow-blue-900/10 ring-blue-200" : "shadow-sm ring-slate-100"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Image src="/logo.png" alt="" width={56} height={56} className="rounded-2xl" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold">Swappy {r.version}</h3>
                          {i === 0 && <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">{t("ล่าสุด")}</span>}
                        </div>
                        <p className="text-sm text-slate-500">
                          {t("วันที่ออก")} {r.date}{r.sizeBytes ? ` · ${t("ขนาด")} ${mb(r.sizeBytes)}` : ""} · {t("ต้องใช้ Android {v} ขึ้นไป", { v: r.minAndroid })}
                        </p>
                      </div>
                    </div>
                    <a href={r.file!} download className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700">
                      <Icon name="plus" className="h-4 w-4 rotate-45" /> {t("ดาวน์โหลด APK")}
                    </a>
                  </div>
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t("สิ่งที่เปลี่ยนแปลง")}</p>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      {(lang === "th" ? r.notes.th : r.notes.en).map((n) => (
                        <li key={n} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />{n}</li>
                      ))}
                    </ul>
                    {r.sha256 && <p className="mt-4 break-all text-[11px] text-slate-400">{t("ตรวจสอบไฟล์ (SHA-256)")}: <span className="font-mono">{r.sha256}</span></p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-400">{t("ยังไม่มีไฟล์ให้ดาวน์โหลด — เร็วๆ นี้")}</div>
          )}

          {RELEASES.length > 0 && (
            <div className="mt-10">
              <h3 className="mb-4 text-lg font-extrabold">{t("ประวัติเวอร์ชัน")}</h3>
              <ol className="space-y-3 border-l-2 border-blue-100 pl-5">
                {RELEASES.map((r) => (
                  <li key={r.version} className="relative">
                    <span className="absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white" />
                    <p className="font-bold">v{r.version} <span className="ml-1 text-sm font-normal text-slate-400">{r.date}</span></p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-500">
                      {(lang === "th" ? r.notes.th : r.notes.en).map((n) => <li key={n}>{n}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-10 rounded-3xl bg-blue-50 p-6">
            <h3 className="mb-3 font-extrabold text-blue-900">{t("วิธีติดตั้ง")}</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-blue-900/80">
              {["ดาวน์โหลดไฟล์ APK ลงมือถือ", "เปิดไฟล์ แล้วอนุญาต “ติดตั้งแอปจากแหล่งที่ไม่รู้จัก” หากระบบถาม", "กดติดตั้ง แล้วเปิดแอป Swappy", "เพิ่มวิดเจ็ต: กดค้างที่หน้าจอหลัก → วิดเจ็ต → Swappy"].map((x) => <li key={x}>{t(x)}</li>)}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 md:px-6">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-center text-white shadow-2xl shadow-blue-700/30 md:p-14">
          <Image src="/logo.png" alt="" width={72} height={72} className="mx-auto rounded-2xl shadow-lg" />
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight">{t("พร้อมจัดตารางเวรให้เป็นระเบียบแล้วหรือยัง?")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">{t("สร้างบัญชีฟรี แล้วเริ่มลงเวรและชวนเพื่อนร่วมงานได้ในไม่กี่นาที")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-2xl bg-white px-7 py-3.5 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50">{t("เริ่มต้นใช้งานฟรี")}</Link>
            <Link href="/login" className="rounded-2xl bg-blue-500/40 px-7 py-3.5 font-semibold text-white ring-1 ring-white/30 transition hover:bg-blue-500/60">{t("เข้าสู่ระบบ")}</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2">
          <Image src="/logo.png" alt="" width={22} height={22} className="rounded-md" />
          <span className="font-semibold text-slate-500">Swappy</span>
        </div>
        <p className="mt-2">© {new Date().getFullYear()} Swappy · {t("ระบบจัดการตารางเวรสำหรับพนักงานปฏิบัติการ")}</p>
      </footer>
    </div>
  );
}
