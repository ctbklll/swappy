import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { cookies } from "next/headers";
import { LangProvider } from "@/components/LangProvider";
import { LANG_COOKIE, translate, type Lang } from "@/lib/i18n";
import "./globals.css";

const font = Noto_Sans_Thai({ variable: "--font-sans-th", subsets: ["thai", "latin"] });

async function getLang(): Promise<Lang> {
  return (await cookies()).get(LANG_COOKIE)?.value === "en" ? "en" : "th";
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: translate(lang, "Swappy · จัดการตารางเวร"),
    description: translate(lang, "ระบบบริหารจัดการตารางเวรและแลกเปลี่ยนเวรสำหรับพนักงานปฏิบัติการ"),
  };
}

export const viewport: Viewport = { themeColor: "#2563eb", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${font.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LangProvider initial={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
