"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useT } from "./LangProvider";

interface Review { id: string; name: string; rating: number; comment: string; createdAt: string; canDelete: boolean }
interface Data { reviews: Review[]; count: number; average: number | null; signedIn: boolean; mine: { rating: number; comment: string } | null }

function Stars({ value, size = "h-4 w-4", onPick }: { value: number; size?: string; onPick?: (n: number) => void }) {
  return (
    <span className="inline-flex gap-0.5" role={onPick ? "radiogroup" : "img"} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <svg viewBox="0 0 24 24" className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} aria-hidden>
            <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
          </svg>
        );
        return onPick ? (
          <button key={n} type="button" onClick={() => onPick(n)} role="radio" aria-checked={n === value} aria-label={`${n}`} className="transition hover:scale-110">
            {star}
          </button>
        ) : <span key={n}>{star}</span>;
      })}
    </span>
  );
}

/** Design placeholders shown ONLY while there are no real reviews. They are clearly labelled and never stored. */
const SAMPLES = [
  { rating: 5, comment: "ดูตารางเวรทั้งเดือนได้ในหน้าเดียว ไม่ต้องไล่ถามในกลุ่มแชทอีกแล้ว" },
  { rating: 5, comment: "แลกเวรกับเพื่อนง่ายมาก กดขอแล้วเพื่อนตอบรับ ตารางอัปเดตเอง" },
  { rating: 4, comment: "วิดเจ็ตบนหน้าจอหลักสะดวก เห็นเวรวันนี้ทันทีโดยไม่ต้องเปิดแอป" },
  { rating: 5, comment: "เพิ่มเพื่อนด้วย QR Code เร็วดี และมีแจ้งเตือนทุกครั้งที่มีคำขอ" },
];

/** Landing-page section: real reviews written by signed-in users (stored in the database). */
export function ReviewsSection() {
  const { t, ts, lang } = useT();
  const [data, setData] = useState<Data | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<Data>("/api/reviews");
      setData(d);
      if (d.mine) { setRating(d.mine.rating); setComment(d.mine.comment); }
    } catch { /* keep the empty state */ }
  }, []);
  // load() only sets state after awaiting the network
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/reviews", "POST", { rating, comment });
      setMsg({ ok: true, text: t("ขอบคุณสำหรับรีวิว!") });
      await load();
    } catch (er) {
      setMsg({ ok: false, text: ts((er as Error).message) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t("ลบรีวิวนี้?"))) return;
    try { await api(`/api/reviews/${id}`, "DELETE"); setComment(""); setRating(5); await load(); } catch { /* ignore */ }
  };

  return (
    <section id="reviews" className="scroll-mt-16 bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-sm font-bold text-blue-600">{t("รีวิว")}</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{t("เสียงจากผู้ใช้ Swappy")}</h2>
          {data && data.count > 0 && data.average !== null && (
            <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-100">
              <span className="text-3xl font-extrabold text-slate-900">{data.average.toFixed(1)}</span>
              <div className="text-left">
                <Stars value={Math.round(data.average)} />
                <p className="text-xs text-slate-400">{t("จาก {n} รีวิว", { n: data.count })}</p>
              </div>
            </div>
          )}
        </div>

        {data && data.reviews.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.reviews.map((r) => (
              <figure key={r.id} className="flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <Stars value={r.rating} />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">“{r.comment}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">{r.name.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.name}</span>
                    <span className="block text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </span>
                  {r.canDelete && <button onClick={() => remove(r.id)} className="text-xs font-semibold text-rose-500 hover:underline">{t("ลบ")}</button>}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : data ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SAMPLES.map((r) => (
                <figure key={r.comment} className="relative flex flex-col rounded-3xl border border-dashed border-slate-300 bg-white/70 p-5">
                  <span className="absolute right-4 top-4 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{t("ตัวอย่าง")}</span>
                  <Stars value={r.rating} />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">“{t(r.comment)}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-400">?</span>
                    <span className="text-sm font-semibold text-slate-400">{t("ผู้ใช้ตัวอย่าง")}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">{t("การ์ดข้างต้นเป็นตัวอย่างการแสดงผล ไม่ใช่รีวิวจากผู้ใช้จริง — รีวิวจริงจะมาแทนที่เมื่อมีผู้ใช้เขียนรีวิว")}</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-slate-400">…</div>
        )}

        <div className="mx-auto mt-10 max-w-xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          {data?.signedIn ? (
            <form onSubmit={submit} className="space-y-4">
              <h3 className="font-extrabold">{data.mine ? t("แก้ไขรีวิวของคุณ") : t("เขียนรีวิว")}</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{t("ให้คะแนน")}</span>
                <Stars value={rating} size="h-7 w-7" onPick={setRating} />
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={300} required
                placeholder={t("เล่าประสบการณ์การใช้งานของคุณ")}
                className="w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              {msg && <p className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`} role="status">{msg.text}</p>}
              <button disabled={busy} className="w-full rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50">
                {data.mine ? t("อัปเดตรีวิว") : t("ส่งรีวิว")}
              </button>
            </form>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-sm text-slate-500">{t("เข้าสู่ระบบเพื่อเขียนรีวิว — แสดงเฉพาะรีวิวจากผู้ใช้จริง")}</p>
              <Link href="/login" className="inline-block rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700">{t("เข้าสู่ระบบ")}</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
