import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { vocabularyList, VocabItem } from "@/data/vocab";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, X, ArrowLeft, RotateCcw, AlertTriangle } from "lucide-react";
import { speakJa } from "@/lib/tts";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/vocab-quiz")({
  head: () => ({
    meta: [{ title: "Kiểm tra Từ vựng" }],
  }),
  component: VocabQuizPage,
});

const MAX_WRONG = 5;

// Utility to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Generate options for a question
function generateOptions(correctItem: VocabItem, allItems: VocabItem[]) {
  const options = [correctItem];
  const others = allItems.filter((i) => i.id !== correctItem.id);
  const shuffledOthers = shuffle(others).slice(0, 3);
  options.push(...shuffledOthers);
  return shuffle(options);
}

function VocabQuizPage() {
  const navigate = useNavigate();

  // Initialize quiz state
  const [questions, setQuestions] = useState<VocabItem[]>(() =>
    shuffle(vocabularyList)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [score, setScore] = useState(0);
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Current question and its options
  const currentQuestion = questions[currentIndex];
  
  // Memoize options so they don't re-shuffle on every render for the same question
  const currentOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return generateOptions(currentQuestion, vocabularyList);
  }, [currentQuestion]);

  const handleRestart = useCallback(() => {
    setQuestions(shuffle(vocabularyList));
    setCurrentIndex(0);
    setWrongCount(0);
    setScore(0);
    setShowFailDialog(false);
    setShowSuccessDialog(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
  }, []);

  const handleAnswer = (optionId: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(optionId);
    setIsAnswered(true);

    const isCorrect = optionId === currentQuestion.id;
    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      setWrongCount((w) => w + 1);
    }

    setTimeout(() => {
      if (!isCorrect && wrongCount + 1 >= MAX_WRONG) {
        setShowFailDialog(true);
      } else if (currentIndex + 1 >= questions.length) {
        setShowSuccessDialog(true);
      } else {
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
      }
    }, 1000); // 1s delay to see the result
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-600">
            <Link to="/vocab">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Từ vựng
            </Link>
          </Button>
          <div className="flex gap-4 items-center">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm">
              Đúng: {score}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-sm">
              Sai: {wrongCount}/{MAX_WRONG}
            </Badge>
          </div>
        </div>
        <Progress value={((currentIndex) / questions.length) * 100} className="h-1 rounded-none bg-slate-100" />
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8 space-y-4">
          <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
            Câu hỏi {currentIndex + 1} / {questions.length}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 font-jp tracking-tight">
            {currentQuestion.jp}
          </h2>
          <p className="text-lg text-slate-500 font-medium">
            {currentQuestion.romaji}
          </p>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full w-12 h-12 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 mt-4 shadow-sm"
            onClick={() => speakJa(currentQuestion.jp)}
          >
            <Volume2 className="w-6 h-6" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {currentOptions.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === currentQuestion.id;
            
            let btnClass = "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 bg-white";
            
            if (isAnswered) {
              if (isCorrect) {
                btnClass = "border-green-500 bg-green-50 text-green-700 shadow-sm";
              } else if (isSelected && !isCorrect) {
                btnClass = "border-red-500 bg-red-50 text-red-700 shadow-sm";
              } else {
                btnClass = "border-slate-200 text-slate-400 bg-slate-50 opacity-50";
              }
            }

            return (
              <Button
                key={option.id}
                variant="outline"
                className={`h-auto min-h-[4rem] p-4 text-left justify-start whitespace-normal text-base sm:text-lg transition-all rounded-xl border-2 ${btnClass}`}
                onClick={() => handleAnswer(option.id)}
                disabled={isAnswered}
              >
                {option.vi}
              </Button>
            );
          })}
        </div>
      </main>

      {/* Fail Dialog */}
      <AlertDialog open={showFailDialog}>
        <AlertDialogContent className="max-w-md border-none shadow-2xl rounded-3xl">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-2xl text-center font-bold text-slate-900">
              Trượt bài kiểm tra!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-base">
              Bạn đã trả lời sai {MAX_WRONG} câu. Hãy ôn tập lại kỹ hơn và thử lại nhé!
            </AlertDialogDescription>
            <div className="bg-slate-50 rounded-xl p-4 mt-4 text-center">
              <span className="block text-sm text-slate-500 font-medium mb-1">Số câu trả lời đúng</span>
              <span className="text-3xl font-black text-indigo-600">{score}</span>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogAction onClick={handleRestart} className="w-full h-12 text-base rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
              <RotateCcw className="w-5 h-5 mr-2" />
              Làm lại
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog}>
        <AlertDialogContent className="max-w-md border-none shadow-2xl rounded-3xl">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Volume2 className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-2xl text-center font-bold text-slate-900">
              Tuyệt vời!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-base">
              Bạn đã hoàn thành xuất sắc toàn bộ {questions.length} từ vựng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogAction onClick={handleRestart} className="w-full h-12 text-base rounded-xl font-bold bg-green-600 hover:bg-green-700 transition-all shadow-md shadow-green-200">
              <RotateCcw className="w-5 h-5 mr-2" />
              Làm lại
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
