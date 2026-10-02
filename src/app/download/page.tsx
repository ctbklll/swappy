"use client";
import Image from "next/image";
import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { useT } from "@/components/LangProvider";
import { Icon } from "@/components/ui";
import releases from "@/data/releases.json";

type Release = (typeof releases)[number];
const RELEASES = releases as Release[];
const mb = (b: number) => `${(b / 1048576).toFixed(1)} MB`;

export default function DownloadPage() {
  const { t, lang } = useT();
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <LandingHeader active="download" />
      <main>
      <section id="download" className="py-16">
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
                      <Icon name="download" className="h-4 w-4" /> {t("ดาวน์โหลด APK")}
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

      </main>
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2">
          <Image src="/logo.png" alt="" width={22} height={22} className="rounded-md" />
          <span className="font-semibold text-slate-500">Swappy</span>
        </div>
        <p className="mt-2">© {new Date().getFullYear()} Swappy · <Link href="/welcome" className="hover:text-blue-600">{t("หน้าแรก")}</Link></p>
      </footer>
    </div>
  );
}
