"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ListChecks,
  AlertTriangle,
  BookOpen,
  Volume2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Server,
  FileUp,
  PlusCircle,
} from "lucide-react";
import { Exam } from "@/data/exams";
import { getAllExams } from "@/data/exam-store";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const { isAdmin } = useAuth();
  const [allExams, setAllExams] = useState<Exam[]>([]);

  useEffect(() => {
    // Load local and NestJS custom exams
    const local = getAllExams();
    setAllExams(local);

    // Fetch latest from NestJS API
    fetch("/api/nest/exams")
      .then((res) => (res.ok ? res.json() : []))
      .then((apiExams: Exam[]) => {
        if (Array.isArray(apiExams) && apiExams.length > 0) {
          const map = new Map<string, Exam>();
          local.forEach((e) => map.set(e.id, e));
          apiExams.forEach((e) => map.set(e.id, e));
          setAllExams(Array.from(map.values()));
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 sm:py-24 border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 opacity-90" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-3 py-1 text-xs font-semibold backdrop-blur-md rounded-full">
                ✨ Cập nhật bộ đề thi chuẩn mới nhất 2026
              </Badge>
              {isAdmin && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1 text-xs font-semibold backdrop-blur-md rounded-full">
                  🚀 Dashboard Upload PDF/DOC
                </Badge>
              )}
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-3xl">
              Ôn Thi Chuyển Giai Đoạn 1 <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-400 via-blue-300 to-sky-400 bg-clip-text text-transparent">
                Ngành Cốp Pha (型枠施工)
              </span>
            </h1>

            <p className="max-w-2xl text-base sm:text-xl text-slate-300 leading-relaxed font-normal">
              Luyện các bộ đề thi trắc nghiệm Đúng/Sai (○/×) thực tế tại Nhật Bản. Hỗ trợ tạo đề tự động khi tải file .PDF / .DOC / .DOCX qua NestJS Dashboard!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="h-12 px-7 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <Link href="#exam-list">
                  Bắt đầu làm bài <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {isAdmin && (
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  <Link href="/dashboard">
                    <Server className="mr-2 h-5 w-5" />Dashboard Admin
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-6 border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl backdrop-blur-sm"
              >
                <Link href="/vocab">
                  <BookOpen className="mr-2 h-5 w-5 text-indigo-400" /> Từ vựng chuyên ngành
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Summary Bar */}
      <div className="mx-auto max-w-5xl px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200/80">
          <div className="flex items-center gap-3 p-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{allExams.length || 6} Đề thi</div>
              <div className="text-xs text-slate-500 font-medium">Bao gồm file upload</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">≥ 80%</div>
              <div className="text-xs text-slate-500 font-medium">Tiêu chuẩn ĐẠT</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">143 Từ</div>
              <div className="text-xs text-slate-500 font-medium">Từ vựng cốp pha</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Volume2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">Audio TTS</div>
              <div className="text-xs text-slate-500 font-medium">Đọc tiếng Nhật chuẩn</div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-12 space-y-12">
        {/* NestJS Upload Callout Banner (Admin Root Only) */}
        {isAdmin && (
          <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/30 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  ✨ Tính năng Quản trị: NestJS Document Parser
                </Badge>
                <h3 className="text-2xl font-black tracking-tight">
                  Tạo đề thi mới tức thì từ File .PDF, .DOC, .DOCX!
                </h3>
                <p className="text-slate-300 text-sm max-w-xl">
                  Mỗi khi bạn tải lên 1 file tài liệu tiếng Nhật (.pdf, .doc, .docx), NestJS Dashboard sẽ tự động trích xuất và tạo 1 đề thi giữ nguyên cấu trúc chuẩn (JP, Romaji, Dịch Việt, Từ vựng, Đáp án ○/× & Giải thích).
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-6 rounded-xl shrink-0 shadow-lg shadow-emerald-600/30"
              >
                <Link href="/dashboard">
                  <FileUp className="mr-2 h-5 w-5" /> Tải File Ngay (Dashboard)
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* Rules & Features */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-1.5 bg-indigo-600 rounded-full" />
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quy định & Tính năng luyện thi</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Thời gian 30 phút</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Đồng hồ đếm ngược tự động mô phỏng đúng thời gian thi thật tại Nhật Bản.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Đạt ≥ 80% điểm số</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Mỗi đề có các câu hỏi ○ (Đúng) hoặc × (Sai). Cần trả lời đúng từ 80% trở lên để ĐẠT.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Phát âm & Dịch nghĩa</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Bật/tắt bản dịch tiếng Việt, từ vựng theo câu và nghe âm thanh tiếng Nhật mọi lúc.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Vocabulary Feature Highlight Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-10 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30">
                143 Thẻ từ vựng chuyên ngành Cốp pha
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Học từ vựng Cốp pha (型枠専門用語)
              </h3>
              <p className="text-slate-300 max-w-xl text-sm sm:text-base">
                Tra cứu từ vựng theo chủ đề: Dụng cụ công trường, An toàn lao động, Kỹ thuật ghép khuôn cốp pha, Đo đạc cốt thép. Hỗ trợ Flashcards và âm thanh phát âm.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl shadow-md">
                <Link href="/vocab">
                  <BookOpen className="mr-2 h-5 w-5 text-indigo-600" /> Tra từ vựng
                </Link>
              </Button>
              <Button asChild size="lg" className="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md border border-indigo-400/30">
                <Link href="/vocab-quiz">
                  <Sparkles className="mr-2 h-5 w-5 text-amber-300" /> Thẻ Ôn tập
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Exam List Grid */}
        <section id="exam-list" className="space-y-6 scroll-mt-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-7 w-1.5 bg-indigo-600 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Danh sách đề thi ôn luyện</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{allExams.length} bộ đề thi</span>
              {isAdmin && (
                <Button asChild size="sm" variant="outline" className="h-8 text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                  <Link href="/dashboard">
                    <PlusCircle className="mr-1 h-3.5 w-3.5" /> Thêm đề mới
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allExams.map((exam, index) => {
              const isCustom = exam.id.startsWith("exam-");
              return (
                <Card
                  key={exam.id}
                  className="group relative border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                        isCustom
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-indigo-50 text-indigo-600"
                      }`}>
                        {isCustom ? "✨ File Upload" : `Đề số 0${index + 1}`}
                      </span>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-semibold">
                        {exam.questions.length} câu ○/×
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {exam.title}
                    </CardTitle>
                    {exam.subtitle && (
                      <CardDescription className="line-clamp-2 text-xs text-slate-500 min-h-[2.5rem] mt-1 leading-relaxed">
                        {exam.subtitle}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <Button
                        asChild
                        className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold shadow-md transition-all duration-300 rounded-xl"
                      >
                        <Link href={`/quiz/${exam.id}`}>
                          Bắt đầu thi ngay <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
