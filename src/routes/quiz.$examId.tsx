import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { exams } from "@/data/exams";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sleek Progress Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 -ml-2">
                <Link to="/">
                  <Home className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">Tiến độ làm bài</span>
                <span className="text-sm font-bold text-slate-900">Câu {idx + 1} <span className="text-slate-400 font-medium">/ {total}</span></span>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${
              isTimeCritical ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-slate-50 border-slate-100 text-slate-700"
            }`}>
              <Clock className={`w-4 h-4 ${isTimeCritical ? "text-red-500" : "text-slate-400"}`} />
              <span className="font-mono font-bold text-lg">{countdown.label}</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
          <CardContent className="p-0">
            {/* Question Area */}
            <div className="p-8 sm:p-12 space-y-8">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1">
                    <h2 className="font-jp text-3xl sm:text-4xl lg:text-5xl leading-tight text-slate-900 tracking-tight">
                      <HighlightedJa jp={current!.jp} vocab={current!.vocab} />
                    </h2>
                    <p className="text-lg text-slate-400 font-medium italic tracking-wide">{current!.romaji}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-none shrink-0 ml-4"
                    onClick={() => speakJa(current!.jp)}
                  >
                    <Volume2 className="w-6 h-6" />
                  </Button>
                </div>

                {/* Vocabulary Tags */}
                {current!.vocab.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {current!.vocab.map((v, vi) => (
                      <button
                        key={vi}
                        onClick={() => speakJa(v.jp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-sm group"
                      >
                        <span className="font-jp font-bold">{v.jp}</span>
                        <span className="text-slate-400 group-hover:text-indigo-400">{v.vi}</span>
                      </button>
                    ))}
                  </div>
                )}

                {current!.image && (
                  <figure className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-inner">
                    <img
                      src={current!.image.src}
                      alt={current!.image.alt}
                      className="mx-auto max-h-[340px] w-full object-contain mix-blend-multiply"
                    />
                  </figure>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-4">
                <Button
                  size="lg"
                  variant={answers[idx] === "O" ? "default" : "outline"}
                  className={`h-24 sm:h-32 text-2xl font-black rounded-3xl transition-all border-2 ${
                    answers[idx] === "O" 
                      ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100" 
                      : "border-slate-100 text-slate-400 hover:border-green-200 hover:text-green-600 hover:bg-green-50"
                  } ${currentAnswered && answers[idx] !== "O" ? "opacity-40" : ""}`}
                  onClick={() => answer("O")}
                  disabled={currentAnswered}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl sm:text-5xl">○</span>
                    <span className="text-sm font-bold uppercase tracking-widest">ĐÚNG</span>
                  </div>
                </Button>
                <Button
                  size="lg"
                  variant={answers[idx] === "X" ? "default" : "outline"}
                  className={`h-24 sm:h-32 text-2xl font-black rounded-3xl transition-all border-2 ${
                    answers[idx] === "X" 
                      ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-100" 
                      : "border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
                  } ${currentAnswered && answers[idx] !== "X" ? "opacity-40" : ""}`}
                  onClick={() => answer("X")}
                  disabled={currentAnswered}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl sm:text-5xl">×</span>
                    <span className="text-sm font-bold uppercase tracking-widest">SAI</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Feedback & Navigation */}
            {currentAnswered && (
              <div className={`p-8 animate-in slide-in-from-bottom-4 duration-500 border-t ${
                answers[idx] === current!.answer ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"
              }`}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${answers[idx] === current!.answer ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                        {answers[idx] === current!.answer ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                      <span className={`font-bold text-lg ${answers[idx] === current!.answer ? "text-green-800" : "text-red-800"}`}>
                        {answers[idx] === current!.answer ? "Câu trả lời chính xác" : "Rất tiếc, bạn đã chọn sai"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={goPrev}
                        disabled={idx === 0}
                        className="bg-white hover:bg-slate-50 text-slate-600 px-4 h-12 rounded-2xl font-bold border-slate-200 transition-all shadow-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={goNext}
                        className="bg-slate-900 hover:bg-indigo-600 text-white px-6 h-12 rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 group"
                      >
                        {idx + 1 >= total ? "Xem kết quả" : "Câu tiếp theo"}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Giải thích chi tiết</div>
                    <p className="text-slate-700 leading-relaxed text-base">
                      {current!.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!currentAnswered && (
          <div className="mt-8 flex items-center justify-between px-2">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={idx === 0}
              className="text-slate-500 font-medium h-12 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Câu trước
            </Button>
            <div className="text-center text-slate-400 text-sm font-medium animate-pulse hidden sm:block">
              Vui lòng chọn ○ hoặc ×
            </div>
            <Button
              variant="outline"
              onClick={goNext}
              className="text-slate-500 font-medium h-12 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50"
            >
              {idx + 1 >= total ? "Nộp bài" : "Câu sau"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
