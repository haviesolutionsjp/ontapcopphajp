"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { exams } from "@/data/exams";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Clock, Volume2, ArrowRight, ArrowLeft, Check, X, Home, AlertCircle, HelpCircle } from "lucide-react";
import { speakJa, stopSpeak } from "@/lib/tts";
import { HighlightedJa } from "@/lib/highlight";
import { useCountdown } from "@/hooks/useCountdown";
import { saveExamResult, supabase } from "@/lib/supabase";

import { getExamById, Exam } from "@/data/exam-store";

const DURATION = 30 * 60; // 30 mins

export default function QuizPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(() => getExamById(examId) || null);

  useEffect(() => {
    if (!exam) {
      fetch(`/api/nest/exams/${examId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.questions) {
            setExam(data);
          }
        })
        .catch(console.error);
    }
  }, [examId, exam]);

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Array<"O" | "X" | null>>([]);

  useEffect(() => {
    if (exam && answers.length === 0) {
      setAnswers(exam.questions.map(() => null));
    }
  }, [exam, answers.length]);
  const [showVocabulary, setShowVocabulary] = useState<Record<number, boolean>>({});
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});

  const finish = useCallback(
    async (finalAnswers: Array<"O" | "X" | null>) => {
      if (!exam) return;
      stopSpeak();
      const finishedAt = Date.now();
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        examId: exam.id,
        answers: finalAnswers,
        finishedAt,
        synced: Boolean(user),
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`quiz:${exam.id}`, JSON.stringify(payload));
      }

      // Save to Supabase DB if user is logged in
      if (user) {
        let correct = 0;
        exam.questions.forEach((q, i) => {
          if (finalAnswers[i] === q.answer) correct += 1;
        });
        const total = exam.questions.length;
        const passThreshold = total === 20 ? 16 : Math.ceil(total * 0.8);
        const scorePct = Math.round((correct / total) * 100);

        await saveExamResult(user.id, {
          exam_id: exam.id,
          exam_title: exam.title,
          score: correct,
          total,
          passed: correct >= passThreshold,
          score_pct: scorePct,
          answers: finalAnswers,
          finished_at: finishedAt,
        });
      }

      router.push(`/result/${exam.id}`);
    },
    [exam, router]
  );

  const countdown = useCountdown(DURATION, () => finish(answers));

  const total = exam?.questions.length ?? 0;
  const current = exam?.questions[idx];
  const currentAnswered = answers[idx] != null;

  const goNext = useCallback(() => {
    if (!exam) return;
    if (idx + 1 >= total) {
      finish(answers);
    } else {
      stopSpeak();
      setIdx((i) => i + 1);
    }
  }, [exam, idx, total, answers, finish]);

  const goPrev = useCallback(() => {
    if (idx > 0) {
      stopSpeak();
      setIdx((i) => i - 1);
    }
  }, [idx]);

  const answer = (val: "O" | "X") => {
    if (currentAnswered) return;
    const next = answers.slice();
    next[idx] = val;
    setAnswers(next);
  };

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, goNext, goPrev]);

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <Card className="max-w-md w-full border-none shadow-xl">
          <CardContent className="py-12 space-y-6 text-center">
            <div className="p-4 bg-red-50 text-red-600 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <X className="w-8 h-8" />
            </div>
            <p className="text-slate-600 font-medium">Không tìm thấy dữ liệu đề thi này.</p>
            <Button asChild className="w-full bg-slate-900">
              <Link href="/">Quay về trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-quiz instructions modal / card
  if (!started) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <Card className="max-w-lg w-full border-none shadow-2xl overflow-hidden rounded-3xl bg-white">
          <div className="h-3 bg-gradient-to-r from-indigo-600 to-blue-500 w-full" />
          <CardContent className="py-10 px-6 sm:px-8 space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                Đề thi ôn luyện Cốp pha
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {exam.title}
              </h1>
              {exam.subtitle && <p className="text-sm text-slate-500 font-medium">{exam.subtitle}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Số câu hỏi</div>
                <div className="text-xl font-black text-slate-900">{total} câu ○/×</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Thời gian</div>
                <div className="text-xl font-black text-slate-900">30:00 Phút</div>
              </div>
            </div>

            <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Không thể quay lại sửa câu đã trả lời.</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Trả lời đúng từ 16/20 câu (≥80%) là ĐẠT.</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hỗ trợ nghe âm thanh phát âm tiếng Nhật tự nhiên.</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-200 transition-all rounded-xl"
                onClick={() => {
                  setStarted(true);
                  countdown.start();
                }}
              >
                Bắt đầu làm bài ngay
              </Button>
              <Button asChild variant="ghost" className="h-12 px-5 text-slate-500 font-medium rounded-xl">
                <Link href="/">Hủy bỏ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPct = ((idx + (currentAnswered ? 1 : 0)) / total) * 100;
  const isTimeCritical = countdown.remaining < 60;
  const isVocabularyVisible = showVocabulary[current!.id] ?? false;
  const isTranslationVisible = showTranslation[current!.id] ?? false;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sticky Quiz Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Button asChild variant="ghost" size="icon" className="-ml-2 text-slate-500 rounded-xl">
            <Link href="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>

          <div className="min-w-0 text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600">
              Câu {idx + 1} / {total}
            </div>
            <div className="font-mono text-base font-black text-slate-800">{countdown.label}</div>
          </div>

          <div
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${
              isTimeCritical ? "bg-red-50 text-red-600 border border-red-200 animate-pulse" : "bg-slate-100 text-slate-700"
            }`}
          >
            <Clock className={`h-3.5 w-3.5 ${isTimeCritical ? "text-red-500" : "text-slate-500"}`} />
            {isTimeCritical ? "Sắp hết giờ" : "Đang làm"}
          </div>
        </div>

        <div className="h-1.5 w-full bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Main Question Interface */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 sm:py-8 space-y-6">
        <section className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[11px] font-bold">
                  Câu hỏi tiếng Nhật
                </Badge>
                <h2 className="font-jp text-2xl sm:text-3xl leading-snug text-slate-900 font-bold">
                  <HighlightedJa jp={current!.jp} vocab={current!.vocab} />
                </h2>
                <p className="text-sm sm:text-base text-slate-400 font-medium italic">{current!.romaji}</p>
              </div>

              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 shrink-0 border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors rounded-2xl shadow-sm"
                onClick={() => speakJa(current!.jp)}
                title="Nghe phát âm tiếng Nhật"
              >
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Translation Toggle */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">Bản dịch tiếng Việt</div>
                  <div className="text-xs text-slate-400">Tắt/Bật hỗ trợ đọc hiểu</div>
                </div>
                <Switch
                  checked={isTranslationVisible}
                  onCheckedChange={(checked) =>
                    setShowTranslation((prev) => ({
                      ...prev,
                      [current!.id]: checked,
                    }))
                  }
                  aria-label="Bật hoặc tắt bản dịch tiếng Việt"
                />
              </div>
              {isTranslationVisible && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 text-base font-semibold leading-relaxed">
                  {current!.vi}
                </div>
              )}
            </div>

            {/* Vocabulary Breakdown Toggle */}
            {current!.vocab.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Từ vựng trong câu</div>
                    <div className="text-xs text-slate-400">Các từ quan trọng xuất hiện trong câu</div>
                  </div>
                  <Switch
                    checked={isVocabularyVisible}
                    onCheckedChange={(checked) =>
                      setShowVocabulary((prev) => ({
                        ...prev,
                        [current!.id]: checked,
                      }))
                    }
                    aria-label="Bật hoặc tắt từ vựng của câu"
                  />
                </div>

                {isVocabularyVisible && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {current!.vocab.map((v, vi) => (
                      <button
                        key={vi}
                        onClick={() => speakJa(v.jp)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
                      >
                        <Volume2 className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="font-jp font-bold text-slate-900">{v.jp}</span>
                        <span className="text-slate-500">{v.vi}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Diagram / Image */}
            {current!.image && (
              <figure className="border-t border-slate-100 pt-4">
                <img
                  src={current!.image.src}
                  alt={current!.image.alt}
                  className="mx-auto max-h-[300px] w-full object-contain rounded-2xl border border-slate-100 bg-slate-50 p-2"
                />
              </figure>
            )}
          </div>

          {/* Answer Choice Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4 sm:gap-6">
            <Button
              size="lg"
              variant={answers[idx] === "O" ? "default" : "outline"}
              className={`h-28 sm:h-36 rounded-3xl border-2 px-4 transition-all ${
                answers[idx] === "O"
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                  : "border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:bg-emerald-50/30 hover:text-emerald-600"
              } ${currentAnswered && answers[idx] !== "O" ? "opacity-40" : ""}`}
              onClick={() => answer("O")}
              disabled={currentAnswered}
            >
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <span className="text-5xl sm:text-6xl font-normal leading-none">○</span>
                <span className="text-sm sm:text-base font-extrabold uppercase tracking-widest">
                  Đúng (○)
                </span>
              </div>
            </Button>

            <Button
              size="lg"
              variant={answers[idx] === "X" ? "default" : "outline"}
              className={`h-28 sm:h-36 rounded-3xl border-2 px-4 transition-all ${
                answers[idx] === "X"
                  ? "border-rose-500 bg-rose-500 text-white shadow-xl shadow-rose-500/20"
                  : "border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50/30 hover:text-rose-600"
              } ${currentAnswered && answers[idx] !== "X" ? "opacity-40" : ""}`}
              onClick={() => answer("X")}
              disabled={currentAnswered}
            >
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <span className="text-5xl sm:text-6xl font-normal leading-none">×</span>
                <span className="text-sm sm:text-base font-extrabold uppercase tracking-widest">
                  Sai (×)
                </span>
              </div>
            </Button>
          </div>
        </section>

        {/* Answer Feedback & Technical Explanation */}
        {currentAnswered && (
          <section
            className={`rounded-3xl border p-5 sm:p-6 shadow-md transition-all ${
              answers[idx] === current!.answer
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-rose-200 bg-rose-50/70"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                    answers[idx] === current!.answer ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                >
                  {answers[idx] === current!.answer ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <X className="h-4 w-4 stroke-[3]" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <div
                    className={`text-base font-extrabold ${
                      answers[idx] === current!.answer ? "text-emerald-900" : "text-rose-900"
                    }`}
                  >
                    {answers[idx] === current!.answer ? "Chính xác!" : "Chưa chính xác"}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 font-medium">
                    {current!.explanation}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={idx === 0}
                  className="h-11 rounded-xl border-slate-200 px-4 text-slate-600 bg-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={goNext}
                  className="h-11 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold px-6 shadow-md"
                >
                  {idx + 1 >= total ? "Xem kết quả" : "Câu tiếp theo"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        )}

        {!currentAnswered && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={idx === 0}
              className="h-11 rounded-xl border-slate-200 px-4 text-slate-600 bg-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Câu trước
            </Button>
            <span className="hidden text-xs font-semibold text-slate-400 sm:inline-block">
              Chọn Đúng (○) hoặc Sai (×) để trả lời
            </span>
            <Button
              variant="outline"
              onClick={goNext}
              className="h-11 rounded-xl border-slate-200 px-4 text-slate-600 bg-white"
            >
              {idx + 1 >= total ? "Nộp bài" : "Bỏ qua"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
