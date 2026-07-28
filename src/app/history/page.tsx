"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getUserExamHistory, ExamHistoryItem } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { History, Trophy, RotateCcw, ArrowLeft, LogIn, CheckCircle2, XCircle, Calendar } from "lucide-react";

export default function HistoryPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      setFetching(false);
      return;
    }

    async function loadHistory() {
      setFetching(true);
      if (user) {
        const items = await getUserExamHistory(user.id);
        setHistory(items);
      }
      setFetching(false);
    }

    loadHistory();
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Đang tải lịch sử thi từ Supabase...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-xl rounded-3xl bg-white text-center p-8 space-y-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <History className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Yêu Cầu Đăng Nhập</h2>
            <p className="text-sm text-slate-500">
              Vui lòng đăng nhập tài khoản Google để lưu trữ và xem lịch sử thi của bạn.
            </p>
          </div>
          <Button
            onClick={loginWithGoogle}
            size="lg"
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl h-12 shadow-md"
          >
            <LogIn className="mr-2 h-5 w-5" /> Đăng nhập bằng Google
          </Button>
        </Card>
      </div>
    );
  }

  const passedCount = history.filter((item) => item.passed).length;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Header Banner */}
      <header className="bg-slate-900 text-white py-12 border-b border-slate-800">
        <div className="mx-auto max-w-4xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <Avatar className="h-16 w-16 border-2 border-indigo-400 shadow-md">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-indigo-600 text-white text-xl font-extrabold">
                {user.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Link href="/" className="inline-flex items-center text-xs font-semibold text-indigo-300 hover:text-white mb-1">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Trang chủ
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{user.displayName || "Thực tập sinh"}</h1>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="text-center px-3">
              <div className="text-2xl font-black text-white">{history.length}</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Lượt làm bài</div>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center px-3">
              <div className="text-2xl font-black text-emerald-400">{passedCount}</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Lần ĐẠT (≥80%)</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-1.5 bg-indigo-600 rounded-full" />
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Lịch sử kết quả làm bài</h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{history.length} kết quả đã lưu</span>
        </div>

        {history.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-white p-12 text-center rounded-3xl space-y-4">
            <Trophy className="h-12 w-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Chưa có lịch sử làm bài thi nào</h3>
              <p className="text-sm text-slate-500">
                Hãy hoàn tất một bài thi để tự động lưu điểm số và kết quả vào tài khoản của bạn.
              </p>
            </div>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-11 px-6">
              <Link href="/#exam-list">Bắt đầu làm bài ngay</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item, i) => {
              const formattedDate = item.finished_at
                ? new Date(item.finished_at).toLocaleString("vi-VN")
                : "Gần đây";

              return (
                <Card
                  key={item.id || i}
                  className="border-slate-200/90 bg-white hover:shadow-lg transition-all rounded-2xl overflow-hidden"
                >
                  <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-2xl shrink-0 ${
                          item.passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {item.passed ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{item.exam_title}</h3>
                          <Badge
                            className={
                              item.passed ? "bg-emerald-600 text-white font-bold" : "bg-rose-600 text-white font-bold"
                            }
                          >
                            {item.passed ? "ĐẠT (≥80%)" : "CHƯA ĐẠT"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" /> {formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">
                          {item.score}<span className="text-slate-300">/{item.total}</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase">Tỷ lệ: {item.score_pct}%</div>
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 font-bold text-xs h-10 px-4"
                      >
                        <Link href={`/quiz/${item.exam_id}`}>
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Làm lại
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
