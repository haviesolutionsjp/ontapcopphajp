"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { vocabList, VocabItem } from "@/data/vocab";
import { speakJa } from "@/lib/tts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  Trophy,
} from "lucide-react";

export default function VocabQuizPage() {
  const [questions, setQuestions] = useState<
    Array<{
      item: VocabItem;
      options: string[];
    }>
  >([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Generate 10 random questions
  const startNewQuiz = () => {
    const shuffled = [...vocabList].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    const generated = selected.map((item) => {
      // Pick 3 wrong options
      const otherVi = vocabList
        .filter((v) => v.vi !== item.vi)
        .map((v) => v.vi)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [...otherVi, item.vi].sort(() => 0.5 - Math.random());
      return { item, options };
    });

    setQuestions(generated);
    setCurrentIdx(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizFinished(false);
  };

  useEffect(() => {
    startNewQuiz();
  }, []);

  if (questions.length === 0) return null;

  const currentQ = questions[currentIdx];

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    if (opt === currentQ.item.vi) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setQuizFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Banner */}
      <header className="bg-slate-900 text-white py-10 border-b border-slate-800">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between">
          <div>
            <Link
              href="/vocab"
              className="inline-flex items-center text-xs font-semibold text-indigo-300 hover:text-white mb-2"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Sổ từ vựng
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-400" /> Thử Thách Từ Vựng Cốp Pha
            </h1>
          </div>

          <Badge variant="secondary" className="bg-indigo-600 text-white font-bold text-xs py-1.5 px-3">
            10 Câu Trắc Nghiệm
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {!quizFinished ? (
          <>
            {/* Progress & Header */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Câu hỏi {currentIdx + 1} / {questions.length}</span>
              <span className="text-indigo-600 font-extrabold">Điểm: {score}</span>
            </div>
            <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-2" />

            {/* Question Card */}
            <Card className="border-slate-200/90 shadow-xl bg-white rounded-3xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      Từ vựng {currentQ.item.group || "Cốp pha"}
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 font-jp mt-3">
                      {currentQ.item.kanji || currentQ.item.jp}
                    </div>
                    {currentQ.item.kanji && (
                      <div className="text-base text-indigo-600 font-jp font-bold mt-1">
                        {currentQ.item.jp}
                      </div>
                    )}
                    <div className="text-sm text-slate-400 font-mono mt-1">
                      {currentQ.item.romaji}
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => speakJa(currentQ.item.jp)}
                    className="h-11 w-11 rounded-2xl text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Chọn nghĩa tiếng Việt chính xác:
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {currentQ.options.map((opt, i) => {
                      const isCorrect = opt === currentQ.item.vi;
                      const isSelected = opt === selectedOption;

                      let btnStyle = "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100";
                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-50 border-rose-500 text-rose-900 font-bold";
                        } else {
                          btnStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectOption(opt)}
                          disabled={isAnswered}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span className="text-sm sm:text-base font-semibold">{opt}</span>
                          {isAnswered && (
                            <span>
                              {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                              {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-rose-600" />}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next Button */}
                {isAnswered && (
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Button
                      onClick={handleNext}
                      className="h-12 px-6 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-all"
                    >
                      {currentIdx + 1 >= questions.length ? "Xem kết quả" : "Câu tiếp theo"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Quiz Results */
          <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden text-center">
            <CardContent className="p-8 sm:p-12 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border-4 border-amber-100">
                <Trophy className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900">Hoàn Thành Thử Thách!</h2>
                <p className="text-slate-500">Kết quả kiểm tra từ vựng tiếng Nhật Cốp pha</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm mx-auto space-y-1">
                <div className="text-5xl font-black text-indigo-600">{score} / 10</div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">
                  {score >= 8 ? "🌟 Xuất sắc! Từ vựng rất vững" : score >= 5 ? "👍 Khá tốt! Tiếp tục phát huy" : "💪 Cần ôn tập thêm từ vựng"}
                </p>
              </div>

              <div className="flex gap-4 max-w-sm mx-auto pt-4">
                <Button
                  onClick={startNewQuiz}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Thử lại đề mới
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 h-12 border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  <Link href="/vocab">Về sổ từ vựng</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
