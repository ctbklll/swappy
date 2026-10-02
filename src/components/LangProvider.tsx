"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, translate, translateNotification, translateServer, type Lang } from "@/lib/i18n";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a Thai source string, optionally filling {placeholders}. */
  t: (th: string, vars?: Record<string, string | number>) => string;
  /** Translate an API error / notification text coming from the server (always Thai). */
  ts: (th: string) => string;
  /** Translate a stored notification (title/body are saved in Thai). */
  tn: (n: { title: string; body: string }) => { title: string; body: string };
}

const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    router.refresh(); // re-render server parts (metadata, <html lang>)
  }, [router]);

  const t = useCallback((th: string, vars?: Record<string, string | number>) => translate(lang, th, vars), [lang]);
  const ts = useCallback((th: string) => translateServer(lang, th), [lang]);

  const tn = useCallback((n: { title: string; body: string }) => translateNotification(lang, n), [lang]);

  return <LangCtx.Provider value={{ lang, setLang, t, ts, tn }}>{children}</LangCtx.Provider>;
}

export function useT() {
  const c = useContext(LangCtx);
  if (!c) throw new Error("useT outside LangProvider");
  return c;
}

export function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-full bg-slate-100 p-1 text-xs font-bold ${className}`}>
      {(["th", "en"] as const).map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
          className={`rounded-full px-3 py-1.5 transition ${lang === l ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          {l === "th" ? "ไทย" : "EN"}
        </button>
      ))}
    </div>
  );
}
