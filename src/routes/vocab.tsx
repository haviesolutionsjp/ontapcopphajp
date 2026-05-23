import { createFileRoute, Link } from "@tanstack/react-router";
import { vocabularyList } from "@/data/vocab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakJa } from "@/lib/tts";

export const Route = createFileRoute("/vocab")({
  head: () => ({
    meta: [{ title: "Từ vựng chuyên ngành Cốp pha" }],
  }),
  component: VocabPage,
});

function VocabPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-600 hover:text-slate-900">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Link>
          </Button>
          <div className="font-semibold text-slate-900">Từ vựng chuyên ngành</div>
          <div className="w-[88px]" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">143 Từ vựng Cốp pha</h1>
            <p className="text-slate-500 mt-2">Tổng hợp từ vựng thường gặp trong đề thi và công trường thực tế.</p>
          </div>
          <Badge variant="outline" className="bg-white px-3 py-1.5 w-fit">
            Tổng cộng {vocabularyList.length} từ
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vocabularyList.map((vocab) => (
            <Card key={vocab.id} className="group hover:border-indigo-300 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-xs">
                    #{vocab.id}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 -mt-2 -mr-2"
                    onClick={() => speakJa(vocab.jp)}
                    title="Nghe phát âm"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-jp text-slate-900">
                    {vocab.jp}
                  </h3>
                  <p className="text-sm font-medium text-indigo-600/80">
                    {vocab.romaji}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-slate-700 leading-relaxed">
                    {vocab.vi}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
