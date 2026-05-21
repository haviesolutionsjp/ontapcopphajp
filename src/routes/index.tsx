import { createFileRoute, Link } from "@tanstack/react-router";
import { exams } from "@/data/exams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ListChecks, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ôn thi 型枠-基2 · Trắc nghiệm Đúng/Sai" },
      {
        name: "description",
        content:
          "Luyện thi chuyển giai đoạn 1 ngành cốp pha tại Nhật Bản — 6 đề trắc nghiệm Đúng/Sai, 30 phút mỗi đề, có audio TTS tiếng Nhật và giải thích.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-50/50 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-20">
          <Badge variant="outline" className="mb-4 border-indigo-200 bg-indigo-50 text-indigo-700">
            Ngành Cốp pha · Giai đoạn 1
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Ôn thi <span className="font-jp text-indigo-600">型枠-基2</span>
          </h1>
          <p className="max-w-2xl text-lg sm:text-xl text-slate-600 leading-relaxed">
            Hệ thống luyện thi trắc nghiệm Đúng/Sai giúp bạn tự tin vượt qua kỳ thi chuyển giai đoạn 1 ngành Cốp pha tại Nhật Bản.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 space-y-12">
        {/* Rules Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-indigo-600 rounded-full" />
            <h2 className="text-xl font-bold text-slate-900">Quy định phòng thi</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Clock, title: "Thời gian", text: "30 phút cho mỗi đề thi, đếm ngược tự động." },
              { icon: AlertTriangle, title: "Lưu ý", text: "Không được quay lại sửa câu đã trả lời." },
              { icon: ListChecks, title: "Tiêu chuẩn", text: "Đạt từ 80% số câu (≥16/20) là ĐẠT." },
            ].map((rule, i) => (
              <Card key={i} className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <rule.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{rule.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{rule.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Exam Grid */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-indigo-600 rounded-full" />
            <h2 className="text-xl font-bold text-slate-900">Danh sách đề thi</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((e) => (
              <Card 
                key={e.id} 
                className="group border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-indigo-50 transition-colors">
                      <ListChecks className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                      {e.questions.length} câu
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-indigo-700 transition-colors">{e.title}</CardTitle>
                  {e.subtitle && (
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {e.subtitle}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-slate-900 hover:bg-indigo-600 text-white shadow-none transition-all duration-300">
                    <Link to="/quiz/$examId" params={{ examId: e.id }}>
                      Bắt đầu ôn tập
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
          Hệ thống hỗ trợ TTS ja-JP · Dữ liệu chuẩn cốp pha 2026
        </p>
      </footer>
    </div>
  );
}
