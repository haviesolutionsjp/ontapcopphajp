import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { vocabularyList } from "@/data/vocab";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, Check, RotateCcw, Shuffle, Volume2, X } from "lucide-react";
import { speakJa } from "@/lib/tts";

export const Route = createFileRoute("/vocab")({
  head: () => ({
    meta: [{ title: "Từ vựng chuyên ngành Cốp pha" }],
  }),
  component: VocabPage,
});

type ReviewGrade = "again" | "hard" | "good";
type FlashcardProgress = {
  intervalMinutes: number;
  nextReviewAt: number;
  streak: number;
};

const FLASHCARD_STORAGE_KEY = "ontapcoppha:vocab-flashcards:v1";
const SESSION_DELAY = 2;

function shuffle<T>(array: T[]) {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function loadFlashcardProgress(): Record<number, FlashcardProgress> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(FLASHCARD_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, FlashcardProgress>;
    return Object.fromEntries(
      Object.entries(parsed).map(([id, progress]) => [Number(id), progress]),
    );
  } catch {
    return {};
  }
}

function saveFlashcardProgress(progress: Record<number, FlashcardProgress>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(progress));
}

function formatInterval(minutes: number) {
  if (minutes < 60) return `${minutes} phút`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} giờ`;
  return `${Math.round(hours / 24)} ngày`;
}

function createNextProgress(
  current: FlashcardProgress | undefined,
  grade: ReviewGrade,
): FlashcardProgress {
  const baseInterval = current?.intervalMinutes ?? 0;
  const streak = current?.streak ?? 0;

  let intervalMinutes = 10;
  let nextStreak = 0;

  if (grade === "again") {
    intervalMinutes = 10;
    nextStreak = 0;
  } else if (grade === "hard") {
    intervalMinutes =
      baseInterval <= 0 ? 60 * 24 : Math.max(60 * 12, Math.round(baseInterval * 1.4));
    nextStreak = Math.max(1, streak);
  } else {
    intervalMinutes =
      baseInterval <= 0 ? 60 * 24 * 3 : Math.max(60 * 24, Math.round(baseInterval * 2.2));
    nextStreak = streak + 1;
  }

  return {
    intervalMinutes,
    streak: nextStreak,
    nextReviewAt: Date.now() + intervalMinutes * 60 * 1000,
  };
}

function buildSessionDeck(progress: Record<number, FlashcardProgress>) {
  const now = Date.now();
  const due = vocabularyList.filter((item) => (progress[item.id]?.nextReviewAt ?? 0) <= now);
  const source = due.length > 0 ? due : vocabularyList;
  return shuffle(source);
}

function dueCount(progress: Record<number, FlashcardProgress>) {
  const now = Date.now();
  return vocabularyList.filter((item) => (progress[item.id]?.nextReviewAt ?? 0) <= now).length;
}

function nextReviewLabel(timestamp: number) {
  const diffMinutes = Math.max(0, Math.round((timestamp - Date.now()) / 60000));
  if (diffMinutes < 1) return "Đến hạn ngay";
  if (diffMinutes < 60) return `Sau ${diffMinutes} phút`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `Sau ${hours} giờ`;
  return `Sau ${Math.round(hours / 24)} ngày`;
}

function VocabPage() {
  const initialProgress = useMemo(() => loadFlashcardProgress(), []);
  const [flashProgress, setFlashProgress] = useState<Record<number, FlashcardProgress>>(
    () => initialProgress,
  );
  const [sessionDeck, setSessionDeck] = useState(() => buildSessionDeck(initialProgress));
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    saveFlashcardProgress(flashProgress);
  }, [flashProgress]);

  const dueNow = useMemo(() => dueCount(flashProgress), [flashProgress]);
  const currentCard = sessionDeck[0];
  const currentProgress = currentCard ? flashProgress[currentCard.id] : undefined;

  const restartSession = () => {
    setSessionDeck(buildSessionDeck(flashProgress));
    setShowAnswer(false);
  };

  const clearProgress = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(FLASHCARD_STORAGE_KEY);
    }
    setFlashProgress({});
    setSessionDeck(shuffle(vocabularyList));
    setShowAnswer(false);
  };

  const gradeCurrent = (grade: ReviewGrade) => {
    if (!currentCard) return;

    const nextProgress = createNextProgress(flashProgress[currentCard.id], grade);
    setFlashProgress((prev) => ({
      ...prev,
      [currentCard.id]: nextProgress,
    }));
    setShowAnswer(false);
    setSessionDeck((prev) => {
      const [, ...rest] = prev;
      if (grade !== "again") return rest;

      const delayed = [...rest];
      const insertAt = Math.min(SESSION_DELAY, delayed.length);
      delayed.splice(insertAt, 0, currentCard);
      return delayed;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 text-slate-600 hover:text-slate-900"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
          <div className="font-semibold text-slate-900">Từ vựng chuyên ngành</div>
          <div className="w-[88px]" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              143 Từ vựng Cốp pha
            </h1>
            <p className="max-w-2xl text-slate-500">
              Xem danh sách hoặc học bằng flashcard lặp lại ngắt quãng, với tiến độ lưu lại trên máy
              của bạn.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <Link to="/vocab-quiz">Làm bài kiểm tra</Link>
            </Button>
            <Badge variant="outline" className="h-fit bg-white px-3 py-1.5">
              Tổng cộng {vocabularyList.length} từ
            </Badge>
            <Badge variant="outline" className="h-fit bg-emerald-50 px-3 py-1.5 text-emerald-700">
              Đến hạn: {dueNow}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="flashcard" className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2 bg-white p-1 shadow-sm">
            <TabsTrigger value="flashcard" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Flashcard
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <Shuffle className="h-4 w-4" />
              Danh sách
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flashcard" className="mt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Lặp lại ngắt quãng
                      </div>
                      <div className="text-lg font-semibold text-slate-900">
                        {currentCard ? `Còn ${sessionDeck.length} thẻ` : "Hoàn thành"}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 border-slate-200 px-3 text-slate-600"
                      onClick={restartSession}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Trộn lại
                    </Button>
                  </div>

                  {currentCard ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowAnswer((prev) => !prev)}
                        className={`flex min-h-[18rem] w-full flex-col items-center justify-center rounded-3xl border px-6 py-8 text-center shadow-sm transition-colors ${
                          showAnswer
                            ? "border-emerald-100 bg-emerald-50/70"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {showAnswer ? (
                          <>
                            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                              Đáp án
                            </span>
                            <div className="mt-4 space-y-2">
                              <div className="font-jp text-3xl font-bold text-slate-900 sm:text-4xl">
                                {currentCard.jp}
                              </div>
                              <div className="text-sm font-medium text-slate-500">
                                {currentCard.romaji}
                              </div>
                              <div className="pt-2 text-xl font-semibold text-emerald-700 sm:text-2xl">
                                {currentCard.vi}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Mặt trước
                            </span>
                            <div className="mt-4 space-y-2">
                              <div className="font-jp text-4xl font-bold text-slate-900 sm:text-5xl">
                                {currentCard.jp}
                              </div>
                              <div className="text-base font-medium text-slate-500">
                                {currentCard.romaji}
                              </div>
                            </div>
                            <div className="mt-6 text-sm text-slate-400">Chạm để lật thẻ</div>
                          </>
                        )}
                      </button>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                        <div>Nhấn phát âm nếu cần nghe lại.</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-3 text-slate-600"
                          onClick={() => speakJa(currentCard.jp)}
                        >
                          <Volume2 className="mr-2 h-4 w-4" />
                          Phát âm
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Button
                          variant="outline"
                          className="h-12 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                          onClick={() => gradeCurrent("again")}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Chưa nhớ
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                          onClick={() => gradeCurrent("hard")}
                        >
                          <Shuffle className="mr-2 h-4 w-4" />
                          Nhớ mơ hồ
                        </Button>
                        <Button
                          className="h-12 bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => gradeCurrent("good")}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Nhớ được
                        </Button>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <span className="font-medium text-slate-900">Lần sau:</span>{" "}
                        {currentProgress
                          ? nextReviewLabel(currentProgress.nextReviewAt)
                          : "Chưa học"}
                        {currentProgress && (
                          <span className="ml-2 text-slate-400">
                            • {formatInterval(currentProgress.intervalMinutes)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Đã hết thẻ trong buổi này
                      </div>
                      <p className="mt-3 max-w-md text-slate-500">
                        Bạn có thể trộn lại để học tiếp hoặc xóa tiến độ để bắt đầu từ đầu.
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Button
                          onClick={restartSession}
                          className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Trộn lại
                        </Button>
                        <Button
                          variant="outline"
                          onClick={clearProgress}
                          className="border-slate-200"
                        >
                          Xóa tiến độ
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardContent className="space-y-4 p-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Thống kê
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      Tiến độ hiện tại
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Đến hạn
                      </div>
                      <div className="mt-2 text-2xl font-bold text-slate-900">{dueNow}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Đã lưu
                      </div>
                      <div className="mt-2 text-2xl font-bold text-slate-900">
                        {Object.keys(flashProgress).length}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Nguyên tắc học</div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Đáp án "Chưa nhớ" sẽ quay lại sau một quãng ngắn. "Nhớ mơ hồ" giãn ra hơn.
                      "Nhớ được" đẩy thẻ sang lịch ôn xa hơn.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vocabularyList.map((vocab) => (
                <Card
                  key={vocab.id}
                  className="group border-slate-200 transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-xs">
                        #{vocab.id}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mr-[-0.5rem] mt-[-0.5rem] h-8 w-8 text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-700"
                        onClick={() => speakJa(vocab.jp)}
                        title="Nghe phát âm"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-jp text-xl font-bold text-slate-900">{vocab.jp}</h3>
                      <p className="text-sm font-medium text-slate-500">{vocab.romaji}</p>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="leading-relaxed text-slate-700">{vocab.vi}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
