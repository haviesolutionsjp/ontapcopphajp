"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { exams } from "@/data/exams";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Volume2, Check, X, Home, RotateCcw, BookOpen, Trophy, Sparkles, AlertCircle } from "lucide-react";
import { speakJa } from "@/lib/tts";
import { HighlightedJa } from "@/lib/highlight";

export default function ResultPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const exam = exams.find((e) => e.id === examId);
  const [answers, setAnswers] = useState<Array<"O" | "X" | null>>([]);
  const [filterMode, setFilterMode] = useState<"all" | "correct" | "wrong">("all");

  useEffect(() => {
    if (!exam) return;
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem(`quiz:${exam.id}`);
      if (raw) {
        try {
          const p = JSON.parse(raw);
          setAnswers(p.answers ?? []);
        } catch {
          // ignore
        }
      }
    }
  }, [exam]);

  const result = useMemo(() => {
    if (!exam) return null;
    const total = exam.questions.length;
    let correct = 0;
    exam.questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct += 1;
    });
    const passThreshold = total === 20 ? 16 : Math.ceil(total * 0.8);
    const scorePct = Math.round((correct / total) * 100);
    return { total, correct, passed: correct >= passThreshold, passThreshold, scorePct };
  }, [exam, answers]);

  if (!exam || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <Card className="max-w-md w-full border-none shadow-xl rounded-3xl">
          <CardContent className="py-12 space-y-6 text-center">
            <div className="p-4 bg-slate-100 text-slate-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <Home className="w-8 h-8" />
            </div>
            <p className="text-slate-600 font-medium text-lg">Chưa có kết quả làm bài thi này.</p>
            <Button asChild className="w-full bg-indigo-600 h-12 rounded-xl font-bold">
              <Link href="/">Quay về trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredQuestions = exam.questions.filter((q, i) => {
    const userAns = answers[i];
    const isCorrect = userAns === q.answer;
    if (filterMode === "correct") return isCorrect;
    if (filterMode === "wrong") return !isCorrect;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white py-12 border-b border-slate-800">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-3">
          <Badge variant="outline" className="border-slate-700 text-slate-300 bg-slate-800">
            Kết quả kỳ thi ôn tập
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-white">{exam.title}</h1>
          {exam.subtitle && <p className="text-slate-400 font-medium text-sm max-w-xl mx-auto">{exam.subtitle}</p>}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {/* Score Dashboard Card */}
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Pass/Fail Banner */}
              <div
                className={`p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-4 ${
                  result.passed
                    ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white"
                    : "bg-gradient-to-br from-rose-600 to-red-700 text-white"
                }`}
              >
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-md">
                  {result.passed ? <Trophy className="w-12 h-12 stroke-[2.5]" /> : <AlertCircle className="w-12 h-12 stroke-[2.5]" />}
                </div>
                <div className="space-y-1">
                  <Badge className="bg-white/20 text-white border-none uppercase tracking-widest text-[10px] px-3">
                    {result.passed ? "Kết quả chính thức" : "Cần ôn tập thêm"}
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">
                    {result.passed ? "ĐẠT YÊU CẦU" : "CHƯA ĐẠT"}
                  </h2>
                </div>
                <p className="text-white/90 font-medium text-sm leading-relaxed max-w-xs">
                  {result.passed
                    ? `Xuất sắc! Bạn đã đạt ${result.scorePct}% số câu hỏi (Yêu cầu ≥ 80%).`
                    : `Bạn đạt ${result.scorePct}%. Cần trả lời đúng tối thiểu ${result.passThreshold}/${result.total} câu.`}
                </p>
              </div>

              {/* Numerical breakdown */}
              <div className="p-8 sm:p-10 flex flex-col items-center justify-center space-y-6">
                <div className="space-y-1 text-center">
                  <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                    {result.correct}<span className="text-slate-300">/{result.total}</span>
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs pt-1">Số câu trả lời đúng</p>
                </div>

                <div className="w-full h-px bg-slate-100" />

                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button asChild variant="outline" className="h-12 border-slate-200 text-slate-700 font-bold rounded-xl">
                    <Link href="/"><Home className="w-4 h-4 mr-2" /> Trang chủ</Link>
                  </Button>
                  <Button asChild className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md">
                    <Link href={`/quiz/${exam.id}`}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Làm lại
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Question Review */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-1.5 bg-slate-900 rounded-full" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Xem lại chi tiết từng câu</h2>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tất cả ({exam.questions.length})
              </button>
              <button
                onClick={() => setFilterMode("correct")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === "correct" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-emerald-700"
                }`}
              >
                Đúng ({result.correct})
              </button>
              <button
                onClick={() => setFilterMode("wrong")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === "wrong" ? "bg-rose-600 text-white shadow-sm" : "text-slate-500 hover:text-rose-700"
                }`}
              >
                Sai ({result.total - result.correct})
              </button>
            </div>
          </div>

          <Accordion type="multiple" className="space-y-3">
            {filteredQuestions.map((q) => {
              const originalIndex = exam.questions.findIndex((item) => item.id === q.id);
              const userAns = answers[originalIndex];
              const isCorrect = userAns === q.answer;

              return (
                <AccordionItem
                  key={q.id}
                  value={String(q.id)}
                  className={`border rounded-2xl overflow-hidden px-4 bg-white shadow-sm transition-all ${
                    isCorrect ? "border-emerald-200" : "border-rose-200"
                  }`}
                >
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left w-full">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {isCorrect ? <Check className="w-5 h-5 stroke-[3]" /> : <X className="w-5 h-5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          Câu {originalIndex + 1}
                        </div>
                        <span className="font-jp text-base sm:text-lg font-bold text-slate-900 block truncate">
                          {q.jp}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-6 space-y-6">
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      {/* Question Text */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="font-jp text-xl sm:text-2xl leading-relaxed text-slate-900 font-bold">
                            <HighlightedJa jp={q.jp} vocab={q.vocab} />
                          </p>
                          <p className="text-sm text-slate-400 italic font-medium">{q.romaji}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-10 w-10 rounded-xl border-slate-200 text-indigo-600 hover:bg-indigo-50 shrink-0"
                          onClick={() => speakJa(q.jp)}
                        >
                          <Volume2 className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Image Diagram */}
                      {q.image && (
                        <figure className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <img
                            src={q.image.src}
                            alt={q.image.alt}
                            className="mx-auto max-h-[280px] w-full object-contain"
                          />
                        </figure>
                      )}

                      {/* User vs Correct Answer Comparison */}
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className={`p-4 rounded-2xl border flex flex-col justify-center ${
                            isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Bạn đã chọn
                          </span>
                          <span className={`text-xl font-black ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                            {userAns === "O" ? "○ ĐÚNG" : userAns === "X" ? "× SAI" : "— CHƯA CHỌN"}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Đáp án đúng
                          </span>
                          <span className="text-xl font-black text-slate-900">
                            {q.answer === "O" ? "○ ĐÚNG" : "× SAI"}
                          </span>
                        </div>
                      </div>

                      {/* Translation */}
                      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-1">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          Bản dịch tiếng Việt
                        </div>
                        <p className="text-base font-bold leading-relaxed">{q.vi}</p>
                      </div>

                      {/* Technical Explanation */}
                      <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                          Giải thích kỹ thuật
                        </div>
                        <p className="text-slate-700 leading-relaxed text-sm font-medium">
                          {q.explanation}
                        </p>
                      </div>

                      {/* Vocabulary breakdown */}
                      {q.vocab.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Từ vựng trong câu
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {q.vocab.map((v, vi) => (
                              <button
                                key={vi}
                                onClick={() => speakJa(v.jp)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs font-semibold"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="font-jp font-bold text-slate-900">{v.jp}</span>
                                <span className="text-slate-500">{v.vi}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>
      </main>
    </div>
  );
}
