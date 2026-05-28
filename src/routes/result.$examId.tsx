import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { exams } from "@/data/exams";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Volume2, Check, X, Home, RotateCcw } from "lucide-react";
import { speakJa } from "@/lib/tts";
import { HighlightedJa } from "@/lib/highlight";

export const Route = createFileRoute("/result/$examId")({
  component: ResultPage,
});

function ResultPage() {
  const { examId } = Route.useParams();
  const exam = exams.find((e) => e.id === examId);
  const [answers, setAnswers] = useState<Array<"O" | "X" | null>>([]);

  useEffect(() => {
    if (!exam) return;
    const raw = sessionStorage.getItem(`quiz:${exam.id}`);
    if (raw) {
      try {
        const p = JSON.parse(raw);
        setAnswers(p.answers ?? []);
      } catch {
        // ignore
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
    return { total, correct, passed: correct >= passThreshold, passThreshold };
  }, [exam, answers]);

  if (!exam || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <Card className="max-w-md w-full border-none shadow-xl">
          <CardContent className="py-12 space-y-6 text-center">
            <div className="p-4 bg-slate-50 text-slate-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-slate-100">
              <Home className="w-8 h-8" />
            </div>
            <p className="text-slate-600 font-medium text-lg">Không tìm thấy dữ liệu kết quả.</p>
            <Button asChild className="w-full bg-slate-900 h-12 rounded-xl">
              <Link to="/">Quay về trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 text-center space-y-4">
          <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-50 mb-2">
            Kết quả bài thi ôn tập
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">{exam.title}</h1>
          {exam.subtitle && <p className="text-slate-500 font-medium max-w-2xl mx-auto">{exam.subtitle}</p>}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 space-y-12">
        {/* Score Dashboard */}
        <div className="relative group">
          <div className={`absolute -inset-1 rounded-[2rem] blur-xl opacity-20 transition-all duration-500 group-hover:opacity-30 ${
            result.passed ? "bg-green-500" : "bg-red-500"
          }`} />
          <Card className="relative border-none shadow-2xl rounded-[1.5rem] overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className={`p-10 flex flex-col items-center justify-center text-center space-y-4 ${
                  result.passed ? "bg-green-600 text-white" : "bg-red-600 text-white"
                }`}>
                  <div className="p-4 bg-white/20 rounded-full backdrop-blur-md mb-2">
                    {result.passed ? <Check className="w-12 h-12 stroke-[3]" /> : <X className="w-12 h-12 stroke-[3]" />}
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase">{result.passed ? "Đạt yêu cầu" : "Chưa đạt"}</h2>
                  <p className="text-white/80 font-medium text-lg">
                    {result.passed ? "Chúc mừng bạn đã hoàn thành bài thi!" : "Hãy cố gắng ôn tập thêm nhé!"}
                  </p>
                </div>
                <div className="p-10 flex flex-col items-center justify-center space-y-6">
                  <div className="space-y-1 text-center">
                    <div className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums">
                      {result.correct}<span className="text-slate-300">/{result.total}</span>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tổng điểm số</p>
                  </div>
                  <div className="w-full h-px bg-slate-100" />
                  <div className="flex gap-3 w-full">
                    <Button asChild variant="outline" className="flex-1 h-12 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">
                      <Link to="/"><Home className="w-4 h-4 mr-2" /> Trang chủ</Link>
                    </Button>
                    <Button asChild className="flex-1 h-12 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-slate-200">
                      <Link to="/quiz/$examId" params={{ examId: exam.id }}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Làm lại
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Review */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-slate-900 rounded-full" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center">Xem lại chi tiết</h2>
          </div>

          <Accordion type="multiple" className="space-y-3">
            {exam.questions.map((q, i) => {
              const userAns = answers[i];
              const isCorrect = userAns === q.answer;
              return (
                <AccordionItem
                  key={q.id}
                  value={String(q.id)}
                  className={`border rounded-2xl overflow-hidden px-4 transition-all duration-300 bg-white ${
                    isCorrect ? "border-green-100 hover:border-green-200" : "border-red-100 hover:border-red-200"
                  }`}
                >
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left w-full">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isCorrect ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      }`}>
                        {isCorrect ? <Check className="w-5 h-5 stroke-[3]" /> : <X className="w-5 h-5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Câu {i + 1}</div>
                        <span className="font-jp text-base sm:text-lg font-bold text-slate-900 block truncate leading-tight">
                          {q.jp}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 space-y-6 animate-in fade-in-0 duration-500">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <p className="font-jp text-2xl leading-relaxed text-slate-900 font-bold">
                            <HighlightedJa jp={q.jp} vocab={q.vocab} />
                          </p>
                          <p className="text-lg text-slate-400 font-medium italic">{q.romaji}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-10 w-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                          onClick={() => speakJa(q.jp)}
                        >
                          <Volume2 className="w-5 h-5" />
                        </Button>
                      </div>

                      {q.image && (
                        <figure className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-inner">
                          <img
                            src={q.image.src}
                            alt={q.image.alt}
                            className="mx-auto max-h-[280px] w-full object-contain mix-blend-multiply"
                          />
                        </figure>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={`p-4 rounded-xl border flex flex-col justify-center space-y-1 ${
                          isCorrect ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                        }`}>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Bạn đã chọn</span>
                          <span className={`text-xl font-black ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                            {userAns === "O" ? "○ ĐÚNG" : userAns === "X" ? "× SAI" : "— CHƯA CHỌN"}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-center space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đáp án đúng</span>
                          <span className="text-xl font-black text-slate-900">
                            {q.answer === "O" ? "○ ĐÚNG" : "× SAI"}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200">
                        <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">Dịch nghĩa tiếng Việt</div>
                        <p className="text-lg leading-relaxed font-bold">{q.vi}</p>
                      </div>

                      <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                        <div className="text-xs font-black text-indigo-400 uppercase tracking-widest">Giải thích kỹ thuật</div>
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {q.explanation}
                        </p>
                      </div>

                      {q.vocab.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Từ vựng quan trọng</div>
                          <div className="flex flex-wrap gap-2">
                            {q.vocab.map((v, vi) => (
                              <button
                                key={vi}
                                onClick={() => speakJa(v.jp)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-sm group"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600" />
                                <span className="font-jp font-bold text-slate-900">{v.jp}</span>
                                <span className="text-slate-400 group-hover:text-indigo-400">{v.vi}</span>
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

      <footer className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="h-px w-20 bg-slate-200 mx-auto mb-8" />
        <p className="text-xs text-slate-300 font-bold uppercase tracking-[0.2em]">
          End of exam review · Copyright 2026
        </p>
      </footer>
    </div>
  );
}
