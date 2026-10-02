"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Errors carry the server's (Thai) message; translate with `ts()` from useT() when displaying. */
export async function api<T = unknown>(url: string, method = "GET", data?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.error ?? "เกิดข้อผิดพลาด", res.status);
  return json as T;
}

export function useFetch<T>(url: string | null, opts: { poll?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!url);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!url) return;
    const id = ++seq.current;
    try {
      const d = await api<T>(url);
      if (id === seq.current) { setData(d); setError(null); }
    } catch (e) {
      if (id === seq.current) setError((e as Error).message);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    // load() only sets state after awaiting the network, never synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    if (!opts.poll || !url) return;
    const t = setInterval(() => { if (!document.hidden) void load(); }, opts.poll);
    return () => clearInterval(t);
  }, [load, url, opts.poll]);

  return { data, error, loading, reload: load };
}
