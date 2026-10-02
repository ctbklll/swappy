"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useApp } from "@/components/AppProvider";
import { useT } from "@/components/LangProvider";
import { Empty, Icon, btn, type IconName } from "@/components/ui";

const ICONS: Record<string, IconName> = {
  friend_request: "users", friend_accepted: "check", swap_request: "swap", swap_result: "swap", system: "bell",
};

const minutesAgo = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

export default function Notifications() {
  const { notifications, unread, reloadNotifications } = useApp();
  const { t, tn, lang } = useT();
  const router = useRouter();

  const ago = (iso: string) => {
    const m = minutesAgo(iso);
    if (m < 1) return t("เมื่อสักครู่");
    if (m < 60) return t("{n} นาทีที่แล้ว", { n: m });
    if (m < 1440) return t("{n} ชั่วโมงที่แล้ว", { n: Math.floor(m / 60) });
    return t("{n} วันที่แล้ว", { n: Math.floor(m / 1440) });
  };

  const open = async (id: string, link?: string | null) => {
    await api(`/api/notifications/${id}`, "PATCH");
    await reloadNotifications();
    if (link) router.push(link);
  };

  return (
    <div className="space-y-5" lang={lang}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t("การแจ้งเตือน")}</h1>
          <p className="text-sm text-slate-500">{unread ? t("ยังไม่ได้อ่าน {n} รายการ", { n: unread }) : t("อ่านครบแล้ว")}</p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && <button className={btn.ghost} onClick={async () => { await api("/api/notifications", "PATCH"); await reloadNotifications(); }}>{t("อ่านทั้งหมด")}</button>}
          {notifications.length > 0 && <button className={btn.danger} onClick={async () => { await api("/api/notifications", "DELETE"); await reloadNotifications(); }}>{t("ล้าง")}</button>}
        </div>
      </div>
      {!notifications.length && <Empty icon="bell" text={t("ยังไม่มีการแจ้งเตือน")} />}
      <ul className="space-y-2">
        {notifications.map((n) => {
          const x = tn(n);
          return (
            <li key={n.id}>
              <button onClick={() => open(n.id, n.link)}
                className={`flex w-full items-start gap-3 rounded-3xl p-4 text-left ring-1 transition hover:bg-blue-50/50 ${n.read ? "bg-white ring-slate-100" : "bg-blue-50 ring-blue-200"}`}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${n.read ? "bg-slate-100 text-slate-500" : "bg-blue-600 text-white"}`}>
                  <Icon name={ICONS[n.type] ?? "bell"} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{x.title}</span>
                  <span className="block text-sm text-slate-600">{x.body}</span>
                  <span className="mt-1 block text-xs text-slate-400">{ago(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-blue-600" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
