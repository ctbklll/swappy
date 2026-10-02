"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { api } from "@/lib/client";
import { useApp } from "./AppProvider";
import { useT } from "./LangProvider";
import { Icon, Modal, btn, input } from "./ui";

export function AddFriendModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone?: () => void }) {
  const { user, toast } = useApp();
  const { t, ts } = useT();
  const [tab, setTab] = useState<"mine" | "add">("add");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) QRCode.toDataURL(`SWAPPY:${user.code}`, { margin: 1, width: 360, color: { dark: "#1d4ed8" } }).then(setQr);
  }, [open, user.code]);

  const submit = async (c = code) => {
    if (!c.trim()) return;
    setBusy(true);
    try {
      const r = await api<{ name: string }>("/api/friends", "POST", { code: c });
      toast(t("ส่งคำขอถึง {name} แล้ว", { name: r.name }));
      setCode("");
      onDone?.();
      onClose();
    } catch (e) {
      toast(ts((e as Error).message), "error");
    } finally {
      setBusy(false);
    }
  };

  // Camera QR scanning
  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | undefined;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        const tick = () => {
          if (stopped) return;
          if (v.videoWidth) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const res = jsQR(img.data, img.width, img.height);
            if (res?.data.startsWith("SWAPPY:")) {
              setScanning(false);
              void submit(res.data);
              return;
            }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        toast(t("ไม่สามารถเปิดกล้องได้ กรุณากรอกรหัสแทน"), "error");
        setScanning(false);
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  return (
    <Modal open={open} onClose={() => { setScanning(false); onClose(); }} title={t("เพิ่มเพื่อน")}>
      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
        {(["add", "mine"] as const).map((k) => (
          <button key={k} onClick={() => { setTab(k); setScanning(false); }}
            className={`rounded-xl py-2 transition ${tab === k ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>
            {k === "add" ? t("เพิ่มด้วยรหัส / สแกน") : t("QR ของฉัน")}
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        <div className="flex flex-col items-center gap-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="QR Code" className="h-56 w-56 rounded-3xl bg-white p-3 ring-1 ring-blue-100" />}
          <p className="text-xs text-slate-500">{t("รหัสส่วนตัวของคุณ")}</p>
          <button onClick={() => { void navigator.clipboard?.writeText(user.code); toast(t("คัดลอกรหัสแล้ว")); }}
            className="flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 font-mono text-lg font-bold tracking-wider text-blue-700">
            {user.code} <Icon name="copy" className="h-4 w-4" />
          </button>
          <p className="text-center text-xs text-slate-400">{t("ให้เพื่อนสแกน QR หรือกรอกรหัสนี้เพื่อส่งคำขอเป็นเพื่อน")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scanning ? (
            <div className="overflow-hidden rounded-3xl bg-slate-900">
              <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" />
            </div>
          ) : (
            <button onClick={() => setScanning(true)} className={`${btn.ghost} w-full`}>
              <Icon name="camera" /> {t("สแกน QR Code ด้วยกล้อง")}
            </button>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" /> {t("หรือกรอกรหัส")} <div className="h-px flex-1 bg-slate-200" />
          </div>
          <input className={`${input} text-center font-mono uppercase tracking-wider`} placeholder="SW-XXXXXXXX"
            value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          <button disabled={busy || !code.trim()} onClick={() => submit()} className={`${btn.primary} w-full`}>{t("ส่งคำขอเป็นเพื่อน")}</button>
        </div>
      )}
    </Modal>
  );
}
