"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { vocabList, VocabItem } from "@/data/vocab";
import { speakJa } from "@/lib/tts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Volume2,
  BookOpen,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  LayoutGrid,
  CreditCard,
  Layers,
  Filter,
} from "lucide-react";

export default function VocabPage() {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "flashcard">("grid");

  // Unique category groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    vocabList.forEach((item) => {
      if (item.group) set.add(item.group);
    });
    return Array.from(set);
  }, []);

  // Filtered vocabulary list
  const filteredVocab = useMemo(() => {
    return vocabList.filter((item) => {
      const matchSearch =
        search.trim() === "" ||
        item.jp.toLowerCase().includes(search.toLowerCase()) ||
        (item.kanji && item.kanji.toLowerCase().includes(search.toLowerCase())) ||
        item.romaji.toLowerCase().includes(search.toLowerCase()) ||
        item.vi.toLowerCase().includes(search.toLowerCase()) ||
        (item.hanviet && item.hanviet.toLowerCase().includes(search.toLowerCase()));

      const matchGroup = selectedGroup === "all" || item.group === selectedGroup;

      return matchSearch && matchGroup;
    });
  }, [search, selectedGroup]);

  // Flashcard State
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = filteredVocab[cardIndex] || vocabList[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % filteredVocab.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + filteredVocab.length) % filteredVocab.length);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Header Banner */}
      <header className="bg-slate-900 text-white py-12 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 opacity-90" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-semibold text-indigo-300 hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Quay về Trang chủ
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Sổ Từ Vựng Cốp Pha (型枠用語)
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              Tổng hợp {vocabList.length} từ vựng chuyên ngành cốp pha, thi công công trường Nhật Bản kèm Kanji, Romaji, Hán Việt và âm thanh phát âm.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
              className={`rounded-xl font-bold ${
                viewMode === "grid" ? "bg-indigo-600 text-white" : "border-slate-700 text-slate-200"
              }`}
            >
              <LayoutGrid className="mr-2 h-4 w-4" /> Danh sách ({filteredVocab.length})
            </Button>
            <Button
              variant={viewMode === "flashcard" ? "default" : "outline"}
              onClick={() => {
                setViewMode("flashcard");
                setCardIndex(0);
                setIsFlipped(false);
              }}
              className={`rounded-xl font-bold ${
                viewMode === "flashcard" ? "bg-indigo-600 text-white" : "border-slate-700 text-slate-200"
              }`}
            >
              <CreditCard className="mr-2 h-4 w-4" /> Flashcard Lật Thẻ
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Search & Filters */}
        <div className="space-y-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm từ vựng tiếng Nhật, Kanji, Romaji, Hán Việt hoặc tiếng Việt..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCardIndex(0);
              }}
              className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl text-base focus:bg-white transition-colors"
            />
          </div>

          {/* Group Category Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 flex items-center shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5 mr-1" /> Nhóm:
            </span>
            <button
              onClick={() => {
                setSelectedGroup("all");
                setCardIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedGroup === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả ({vocabList.length})
            </button>

            {groups.map((group) => {
              const count = vocabList.filter((v) => v.group === group).length;
              return (
                <button
                  key={group}
                  onClick={() => {
                    setSelectedGroup(group);
                    setCardIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    selectedGroup === group
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {group} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode: Flashcards */}
        {viewMode === "flashcard" && (
          <div className="max-w-xl mx-auto space-y-6">
            {filteredVocab.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <p className="text-slate-500 font-medium">Không tìm thấy từ vựng nào khớp với từ khóa.</p>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
                  <span>Thẻ {cardIndex + 1} / {filteredVocab.length}</span>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {currentCard.group || "Từ vựng Cốp pha"}
                  </Badge>
                </div>

                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="relative min-h-[300px] w-full cursor-pointer rounded-3xl bg-white p-8 border border-slate-200/90 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                      {isFlipped ? "Mặt sau: Nghĩa tiếng Việt" : "Mặt trước: Tiếng Nhật"}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakJa(currentCard.jp);
                      }}
                    >
                      <Volume2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {!isFlipped ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="text-4xl sm:text-5xl font-black text-slate-900 font-jp tracking-tight">
                        {currentCard.kanji || currentCard.jp}
                      </div>
                      {currentCard.kanji && (
                        <div className="text-lg text-indigo-600 font-jp font-bold">{currentCard.jp}</div>
                      )}
                      <div className="text-sm text-slate-400 font-semibold tracking-wide">
                        {currentCard.romaji}
                      </div>
                      {currentCard.hanviet && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs mt-2">
                          Hán Việt: {currentCard.hanviet}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-4">
                      <div className="text-2xl sm:text-3xl font-black text-indigo-700 leading-snug">
                        {currentCard.vi}
                      </div>
                      <div className="text-sm text-slate-500 font-medium border-t border-slate-100 pt-3">
                        <span className="font-jp font-bold text-slate-800">{currentCard.jp}</span>
                        {currentCard.kanji && ` (${currentCard.kanji})`} — {currentCard.romaji}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors pt-4 border-t border-slate-100">
                    <RotateCw className="h-3.5 w-3.5" /> Nhấp vào thẻ để lật xem {isFlipped ? "Tiếng Nhật" : "Nghĩa tiếng Việt"}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <Button
                    onClick={handlePrevCard}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-700"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Thẻ trước
                  </Button>
                  <Button
                    onClick={handleNextCard}
                    className="flex-1 h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-200"
                  >
                    Thẻ tiếp theo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* View Mode: Grid Cards */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredVocab.map((item, index) => (
              <Card
                key={index}
                className="group border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-2xl font-black text-slate-900 font-jp leading-tight group-hover:text-indigo-600 transition-colors">
                        {item.kanji || item.jp}
                      </div>
                      {item.kanji && (
                        <div className="text-xs text-indigo-600 font-jp font-bold mt-0.5">{item.jp}</div>
                      )}
                      <div className="text-xs text-slate-400 font-mono mt-1">{item.romaji}</div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => speakJa(item.jp)}
                      className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl shrink-0"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{item.vi}</p>
                    {item.hanviet && (
                      <div className="text-[11px] text-slate-500 font-medium">
                        Hán Việt: <span className="font-semibold text-slate-700">{item.hanviet}</span>
                      </div>
                    )}
                  </div>

                  {item.group && (
                    <div className="pt-2">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {item.group}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
