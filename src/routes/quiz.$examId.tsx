import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { exams } from "@/data/exams";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Clock, Volume2, ArrowRight, ArrowLeft, Check, X, Home } from "lucide-react";
import { speakJa, stopSpeak } from "@/lib/tts";
import { useCountdown } from "@/hooks/useCountdown";
import { HighlightedJa } from "@/lib/highlight";

export const Route = createFileRoute("/quiz/$examId")({
  component: QuizPage,
});

const DURATION = 30 * 60;

function QuizPage() {
  const { examId } = Route.useParams();
  const navigate = useNavigate();
  const exam = exams.find((e) => e.id === examId);

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Array<"O" | "X" | null>>(() =>
    exam ? exam.questions.map(() => null) : [],
  );
  const [showVocabulary, setShowVocabulary] = useState<Record<number, boolean>>({});
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});

  const finish = useCallback(
    (finalAnswers: Array<"O" | "X" | null>) => {
      if (!exam) return;
      stopSpeak();
      const payload = {
        examId: exam.id,
        answers: finalAnswers,
        finishedAt: Date.now(),
      };
      sessionStorage.setItem(`quiz:${exam.id}`, JSON.stringify(payload));
      navigate({ to: "/result/$examId", params: { examId: exam.id } });
    },
    [exam, navigate],
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
              <Link to="/">Quay về trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full border-none shadow-2xl overflow-hidden">
          <div className="h-2 bg-indigo-600 w-full" />
          <CardContent className="py-10 px-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-900">{exam.title}</h1>
              {exam.subtitle && <p className="text-slate-500 font-medium">{exam.subtitle}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Số câu hỏi</div>
                <div className="text-xl font-bold text-slate-900">{total} câu</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Thời gian</div>
                <div className="text-xl font-bold text-slate-900">30:00</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Không thể sửa lại đáp án sau khi đã chọn</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Cần đạt ≥ 16/20 câu để vượt qua bài thi</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
                onClick={() => {
                  setStarted(true);
                  countdown.start();
                }}
              >
                Bắt đầu ngay
              </Button>
              <Button asChild variant="ghost" className="h-12 px-6 text-slate-500 font-medium">
                <Link to="/">Hủy bỏ</Link>
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
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Button asChild variant="ghost" size="icon" className="-ml-2 text-slate-500">
            <Link to="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Câu {idx + 1} / {total}
            </div>
            <div className="font-mono text-sm font-semibold text-slate-700">{countdown.label}</div>
          </div>
          <div
            className={`flex items-center gap-2 text-sm font-medium ${
              isTimeCritical ? "text-red-600" : "text-slate-600"
            }`}
          >
            <Clock className={`h-4 w-4 ${isTimeCritical ? "text-red-500" : "text-slate-400"}`} />
            {isTimeCritical ? "Sắp hết giờ" : "Đang làm"}
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-slate-900 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <h2 className="font-jp text-2xl sm:text-3xl lg:text-4xl leading-snug text-slate-900">
                  <HighlightedJa jp={current!.jp} vocab={current!.vocab} />
                </h2>
                <p className="text-sm sm:text-base text-slate-500">{current!.romaji}</p>
              </div>
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0 border-slate-200 text-slate-500"
                onClick={() => speakJa(current!.jp)}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Bản dịch tiếng Việt</div>
                  <div className="text-xs text-slate-500">Mặc định tắt</div>
                </div>
                <Switch
                  checked={isTranslationVisible}
                  onCheckedChange={(checked) =>
                    setShowTranslation((prev) => ({
                      ...prev,
                      [current!.id]: checked,
                    }))
                  }
                  aria-label="Bật hoặc tắt bản dịch tiếng Việt của câu hiện tại"
                />
              </div>
              {isTranslationVisible && (
                <p className="text-base sm:text-lg leading-relaxed text-slate-700">{current!.vi}</p>
              )}
            </div>

            {current!.vocab.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Từ vựng trong câu</div>
                    <div className="text-xs text-slate-500">Mặc định tắt</div>
                  </div>
                  <Switch
                    checked={isVocabularyVisible}
                    onCheckedChange={(checked) =>
                      setShowVocabulary((prev) => ({
                        ...prev,
                        [current!.id]: checked,
                      }))
                    }
                    aria-label="Bật hoặc tắt từ vựng của câu hiện tại"
                  />
                </div>

                {isVocabularyVisible && (
                  <div className="flex flex-wrap gap-2">
                    {current!.vocab.map((v, vi) => (
                      <button
                        key={vi}
                        onClick={() => speakJa(v.jp)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
                      >
                        <span className="font-jp font-medium">{v.jp}</span>
                        <span className="text-slate-500">{v.vi}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {current!.image && (
              <figure className="border-t border-slate-100 pt-4">
                <img
                  src={current!.image.src}
                  alt={current!.image.alt}
                  className="mx-auto max-h-[320px] w-full object-contain"
                />
              </figure>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 sm:gap-6">
            <Button
              size="lg"
              variant={answers[idx] === "O" ? "default" : "outline"}
              className={`h-28 sm:h-36 rounded-[1.5rem] border-2 px-4 transition-all ${
                answers[idx] === "O"
                  ? "border-emerald-500 bg-emerald-400 text-white shadow-[0_18px_35px_-18px_rgba(16,185,129,0.55)]"
                  : "border-slate-100 bg-white text-slate-300 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)] hover:border-slate-200 hover:bg-slate-50"
              } ${currentAnswered && answers[idx] !== "O" ? "opacity-50" : ""}`}
              onClick={() => answer("O")}
              disabled={currentAnswered}
            >
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <span className="text-4xl sm:text-5xl leading-none font-normal">○</span>
                <span className="text-sm sm:text-base font-extrabold uppercase tracking-[0.2em]">
                  Đúng
                </span>
              </div>
            </Button>
            <Button
              size="lg"
              variant={answers[idx] === "X" ? "default" : "outline"}
              className={`h-28 sm:h-36 rounded-[1.5rem] border-2 px-4 transition-all ${
                answers[idx] === "X"
                  ? "border-rose-500 bg-rose-400 text-white shadow-[0_18px_35px_-18px_rgba(244,63,94,0.55)]"
                  : "border-slate-100 bg-white text-slate-300 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)] hover:border-slate-200 hover:bg-slate-50"
              } ${currentAnswered && answers[idx] !== "X" ? "opacity-50" : ""}`}
              onClick={() => answer("X")}
              disabled={currentAnswered}
            >
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <span className="text-4xl sm:text-5xl leading-none font-normal">×</span>
                <span className="text-sm sm:text-base font-extrabold uppercase tracking-[0.2em]">
                  Sai
                </span>
              </div>
            </Button>
          </div>
        </section>

        {currentAnswered && (
          <section
            className={`mt-4 rounded-2xl border p-4 sm:p-5 ${
              answers[idx] === current!.answer
                ? "border-emerald-100 bg-emerald-50/60"
                : "border-rose-100 bg-rose-50/60"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                    answers[idx] === current!.answer ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                >
                  {answers[idx] === current!.answer ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="space-y-1">
                  <div
                    className={`text-sm font-semibold ${
                      answers[idx] === current!.answer ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {answers[idx] === current!.answer ? "Đáp án đúng" : "Đáp án sai"}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{current!.explanation}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={idx === 0}
                  className="h-11 rounded-full border-slate-200 px-4 text-slate-500 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={goNext}
                  className="h-11 rounded-full bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-900"
                >
                  {idx + 1 >= total ? "Xem kết quả" : "Câu tiếp theo"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        )}

        {!currentAnswered && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={idx === 0}
              className="h-10 border-slate-200 px-4 text-slate-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Câu trước
            </Button>
            <div className="hidden text-sm text-slate-400 sm:block">
              Chọn Đúng hoặc Sai để tiếp tục
            </div>
            <Button
              variant="outline"
              onClick={goNext}
              className="h-10 border-slate-200 px-4 text-slate-600"
            >
              {idx + 1 >= total ? "Nộp bài" : "Câu sau"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
