import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Ôn Thi Cốp Pha Nhật Bản - Chuyển Giai Đoạn 1 (型枠)",
  description: "Hệ thống luyện thi trắc nghiệm Đúng/Sai & từ vựng chuyên ngành Cốp pha giai đoạn 1 tại Nhật Bản có âm thanh tiếng Nhật TTS.",
  keywords: ["cốp pha", "luyện thi cốp pha", "型枠", "chuyển giai đoạn 1", "từ vựng cốp pha", "luyện thi nhật bản"],
};

import { AuthProvider } from "@/context/auth-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50/70 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white flex flex-col">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-5xl px-4 space-y-2">
              <p className="font-semibold text-slate-700">Hệ thống hỗ trợ Thực tập sinh ngành Cốp Pha (型枠施工)</p>
              <p className="text-slate-400">© 2026 Ôn thi Cốp pha havietho.jp · Chuẩn bộ đề 6 kỳ thi trắc nghiệm ○/×</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
