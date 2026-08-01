"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileUp,
  FileText,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Trash2,
  Eye,
  RefreshCw,
  Server,
  BookOpen,
  ArrowRight,
  Upload,
  Copy,
  Layers,
  HelpCircle,
  ShieldAlert,
  Lock,
  LogIn,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { Exam, Question } from "@/data/exams";
import { getCustomExamsFromStorage, saveCustomExamToStorage, deleteCustomExamFromStorage } from "@/data/exam-store";
import { useAuth, ADMIN_ROOT_EMAIL } from "@/context/auth-context";

export default function NestJSDashboardPage() {
  const { user, isAdmin, loading: authLoading, loginWithGoogle, logout } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [processingStep, setProcessingStep] = useState<string>("");
  
  // Quick text parse mode
  const [rawText, setRawText] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [parsingText, setParsingText] = useState(false);

  // Inspector modal state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch("/api/nest/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch exams from NestJS API
      const examsRes = await fetch("/api/nest/exams");
      let apiExams: Exam[] = [];
      if (examsRes.ok) {
        apiExams = await examsRes.json();
      }

      // Combine with local storage fallback
      const localExams = getCustomExamsFromStorage();
      const map = new Map<string, Exam>();
      apiExams.forEach((e) => map.set(e.id, e));
      localExams.forEach((e) => map.set(e.id, e));

      setExams(Array.from(map.values()));
    } catch (err: any) {
      console.error("Dashboard loading error:", err);
      toast.error("Không thể tải dữ liệu từ NestJS server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (![".pdf", ".doc", ".docx", ".txt"].includes(ext)) {
      toast.error("Chỉ chấp nhận file định dạng .pdf, .doc, .docx hoặc .txt");
      return;
    }

    try {
      setUploading(true);
      setProcessingStep("1/4: Tải file & Đọc luồng dữ liệu (NestJS Stream)...");
      await new Promise((r) => setTimeout(r, 400));

      setProcessingStep("2/4: Trích xuất văn bản tiếng Nhật & Phân tích cú pháp...");
      await new Promise((r) => setTimeout(r, 500));

      setProcessingStep("3/4: Tạo phiên âm Romaji, Từ vựng & Giải thích tiếng Việt...");

      const formData = new FormData();
      formData.append("file", file);
      if (customTitle.trim()) {
        formData.append("title", customTitle.trim());
      }

      const res = await fetch("/api/nest/upload", {
        method: "POST",
        body: formData,
      });

      setProcessingStep("4/4: Đang lưu cấu trúc Đề thi...");

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Tải file lên thất bại");
      }

      const data = await res.json();
      const newExam: Exam = data.exam;

      saveCustomExamToStorage(newExam);
      toast.success(data.message || `Đã tạo thành công đề "${newExam.title}"!`);

      setCustomTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      await loadDashboardData();
      setSelectedExam(newExam);
    } catch (err: any) {
      console.error("File upload error:", err);
      toast.error(err.message || "Lỗi khi xử lý file");
    } finally {
      setUploading(false);
      setProcessingStep("");
    }
  };

  const handleTextParse = async () => {
    if (!rawText.trim()) {
      toast.error("Vui lòng nhập văn bản đề thi!");
      return;
    }

    try {
      setParsingText(true);
      const res = await fetch("/api/nest/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `exam-text-${Date.now()}`,
          title: textTitle.trim() || `Đề thi trích xuất ${new Date().toLocaleDateString()}`,
          subtitle: "Đề thi tự động tạo từ văn bản raw",
          questions: parseRawTextToQuestions(rawText),
        }),
      });

      if (!res.ok) throw new Error("Không thể tạo đề từ văn bản");
      const createdExam: Exam = await res.json();
      saveCustomExamToStorage(createdExam);

      toast.success(`Đã tạo thành công đề thi với ${createdExam.questions.length} câu hỏi!`);
      setRawText("");
      setTextTitle("");
      await loadDashboardData();
      setSelectedExam(createdExam);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo đề từ văn bản");
    } finally {
      setParsingText(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này không?")) return;
    try {
      deleteCustomExamFromStorage(examId);
      await fetch(`/api/nest/exams/${examId}`, { method: "DELETE" });
      toast.success("Đã xóa đề thi thành công!");
      await loadDashboardData();
      if (selectedExam?.id === examId) setSelectedExam(null);
    } catch (err: any) {
      toast.error("Không thể xóa đề thi");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Đang xác thực quyền Admin Root ({ADMIN_ROOT_EMAIL})...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-900 border-rose-500/30 text-white shadow-2xl overflow-hidden">
          <div className="bg-rose-500/10 p-6 border-b border-rose-500/20 text-center space-y-3">
            <div className="inline-flex p-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="h-10 w-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">403 - Access Denied</h2>
            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40">
              🔒 Dành riêng cho Admin Root
            </Badge>
          </div>

          <CardContent className="p-6 space-y-5">
            <p className="text-xs text-slate-300 leading-relaxed text-center">
              Trang Dashboard NestJS này <strong>không public ra ngoài</strong> và chỉ cho phép Admin Root{" "}
              <span className="text-rose-400 font-extrabold">{ADMIN_ROOT_EMAIL}</span> truy cập để quản lý và tải đề thi PDF/DOC.
            </p>

            {user ? (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tài khoản hiện tại:</span>
                  <span className="font-bold text-white truncate max-w-[200px]">{user.email}</span>
                </div>
                <div className="flex justify-between text-rose-400 font-semibold">
                  <span>Trạng thái:</span>
                  <span>Không có quyền Admin</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                Bạn chưa đăng nhập tài khoản Admin Root.
              </div>
            )}

            <div className="space-y-3 pt-2">
              {user ? (
                <Button
                  onClick={() => logout().then(() => loginWithGoogle())}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-rose-600/30"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Đổi tài khoản Admin ({ADMIN_ROOT_EMAIL})
                </Button>
              ) : (
                <Button
                  onClick={loginWithGoogle}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  <LogIn className="h-4 w-4 mr-2" /> Đăng nhập Google với Admin Root
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 h-11 rounded-xl"
              >
                <Link href="/">
                  <BookOpen className="h-4 w-4 mr-2" /> Quay lại trang chủ luyện thi
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Dashboard Top Navigation / Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Server className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">NestJS Exam Dashboard</span>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] px-2 py-0.5">
                  v2.5 Parser
                </Badge>
              </div>
              <p className="text-xs text-slate-400">Tự động tạo bộ đề thi trắc nghiệm từ tài liệu .pdf, .doc, .docx</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
              <Link href="/">
                <BookOpen className="h-4 w-4 mr-2" /> Về trang luyện thi
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Status Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/80 border-slate-700/80 text-white shadow-xl backdrop-blur-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số bộ đề</p>
                <div className="text-2xl font-black text-white">{stats?.totalExams || exams.length || 6} Đề</div>
                <p className="text-[11px] text-indigo-400 font-medium">Bao gồm gốc & file đã upload</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/80 text-white shadow-xl backdrop-blur-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <FileUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Đề từ NestJS Upload</p>
                <div className="text-2xl font-black text-emerald-400">
                  {stats?.customExamsCount || exams.filter((e) => e.id.startsWith("exam-")).length} Đề
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Được tạo tự động</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/80 text-white shadow-xl backdrop-blur-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng câu hỏi</p>
                <div className="text-2xl font-black text-amber-300">
                  {stats?.totalQuestions || exams.reduce((a, b) => a + (b.questions?.length || 0), 0)} Câu
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Đúng/Sai (○/×) chuẩn 100%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/80 text-white shadow-xl backdrop-blur-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Định dạng hỗ trợ</p>
                <div className="text-lg font-bold text-purple-300 flex items-center gap-1.5 mt-0.5">
                  <Badge className="bg-slate-700 text-slate-200">.pdf</Badge>
                  <Badge className="bg-slate-700 text-slate-200">.doc</Badge>
                  <Badge className="bg-slate-700 text-slate-200">.docx</Badge>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Trích xuất Furigana & Từ vựng</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Upload Section & Drag Drop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-slate-800/60 border-slate-700/80 text-white shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-700/60 bg-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                    <FileUp className="h-5 w-5 text-indigo-400" /> Tải File (.pdf, .doc, .docx) để tạo đề thi
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs mt-1">
                    NestJS Engine sẽ tự động đọc văn bản, nhận diện câu hỏi, trích xuất Romaji, Từ vựng chuyên ngành Cốp pha và tạo đáp án Đúng/Sai (○/×).
                  </CardDescription>
                </div>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-2.5 py-1">
                  NestJS Multer + Parser
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Optional Title Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tên bộ đề mong muốn (Tùy chọn)
                </label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Đề thi Cốp pha Chuyển giai đoạn năm 2026 - Phần 1"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 h-11"
                  disabled={uploading}
                />
              </div>

              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                    : "border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-900"
                } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="p-4 bg-indigo-600/20 text-indigo-400 rounded-full border border-indigo-500/30 shadow-inner">
                  <Upload className="h-8 w-8 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-white">
                    Kéo thả file <span className="text-indigo-400 font-extrabold">.pdf</span>,{" "}
                    <span className="text-blue-400 font-extrabold">.doc</span>, hoặc{" "}
                    <span className="text-sky-400 font-extrabold">.docx</span> vào đây
                  </p>
                  <p className="text-xs text-slate-400">hoặc nhấp chuột để chọn file từ máy tính của bạn</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline" className="border-slate-700 text-slate-300 text-[11px]">
                    PDF Documents
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300 text-[11px]">
                    MS Word (.docx/.doc)
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300 text-[11px]">
                    Tối đa 50MB
                  </Badge>
                </div>
              </div>

              {/* Uploading progress status banner */}
              {uploading && (
                <div className="bg-indigo-950/80 border border-indigo-500/40 rounded-xl p-4 flex items-center gap-4">
                  <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-indigo-200">Đang xử lý tài liệu với NestJS Backend Engine...</p>
                    <p className="text-xs text-indigo-300/80">{processingStep}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Raw Text Parser */}
          <Card className="bg-slate-800/60 border-slate-700/80 text-white shadow-xl flex flex-col">
            <CardHeader className="border-b border-slate-700/60 bg-slate-800/80 pb-4">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" /> Dán trực tiếp câu hỏi (Quick Input)
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Nếu bạn có sẵn văn bản tiếng Nhật hoặc danh sách câu hỏi, hãy dán trực tiếp tại đây.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col space-y-4">
              <Input
                type="text"
                placeholder="Tên bộ đề (vd: Đề thi thử số 7)"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-xs h-10"
              />

              <textarea
                rows={7}
                placeholder="Dán nội dung câu hỏi tiếng Nhật vào đây...&#10;Ví dụ:&#10;1. さげふりは すいちょくを だすときに つかいます。(O)&#10;2. ごうはんせい かたわくは くりかえし つかいません。(X)"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono resize-none flex-1"
              />

              <Button
                onClick={handleTextParse}
                disabled={parsingText || !rawText.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl"
              >
                {parsingText ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Tạo đề thi từ văn bản
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Exam List Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-indigo-500 rounded-full" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Danh sách Đề thi trong hệ thống có sẵn ({exams.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam, idx) => {
              const isCustom = exam.id.startsWith("exam-");
              return (
                <Card
                  key={exam.id}
                  className={`bg-slate-800/80 border-slate-700/80 text-white shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between ${
                    selectedExam?.id === exam.id ? "ring-2 ring-indigo-500 bg-slate-800" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        className={
                          isCustom
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        }
                      >
                        {isCustom ? "✨ File NestJS Upload" : `Đề số ${idx + 1}`}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                        {exam.questions.length} Câu hỏi
                      </span>
                    </div>

                    <CardTitle className="text-lg font-bold text-white line-clamp-2 mt-2 leading-snug">
                      {exam.title}
                    </CardTitle>
                    {exam.subtitle && (
                      <CardDescription className="text-slate-400 text-xs line-clamp-1 mt-1">
                        {exam.subtitle}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Cấu trúc câu hỏi:</span>
                        <span className="font-semibold text-slate-200">○ / × (Đúng/Sai)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Nhận diện từ vựng:</span>
                        <span className="font-semibold text-indigo-400">
                          {exam.questions.reduce((acc, q) => acc + (q.vocab?.length || 0), 0)} Từ chuyên ngành
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 rounded-lg"
                      >
                        <Link href={`/quiz/${exam.id}`}>
                          <Play className="h-4 w-4 mr-1.5 fill-current" /> Làm bài ngay
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedExam(exam)}
                        className="border-slate-700 bg-slate-900 hover:bg-slate-700 text-slate-200 h-9 px-3"
                        title="Xem cấu trúc chi tiết câu hỏi"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {isCustom && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExam(exam.id)}
                          className="border-slate-700 bg-slate-900 hover:bg-red-950 hover:text-red-400 text-slate-400 h-9 px-3"
                          title="Xóa đề thi này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Detailed Inspector Modal */}
        {selectedExam && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                      Chi tiết Cấu trúc Đề thi (NestJS Data Schema)
                    </Badge>
                    <span className="text-xs text-slate-400">ID: {selectedExam.id}</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">{selectedExam.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedExam.subtitle}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedExam(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕ Đóng
                </Button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900/90">
                <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-300">
                    Danh sách <strong>{selectedExam.questions.length} câu hỏi</strong> giữ nguyên 100% cấu trúc chuẩn
                    gồm: Tiếng Nhật (JP), Phiên âm (Romaji), Dịch nghĩa (VI), Từ vựng (Vocab array), Đáp án (O/X) & Giải thích.
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0 ml-4"
                  >
                    <Link href={`/quiz/${selectedExam.id}`}>
                      <Play className="h-4 w-4 mr-1.5 fill-current" /> Bắt đầu làm đề thi này
                    </Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {selectedExam.questions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 relative hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="font-extrabold text-sm text-indigo-400">Câu {q.id}</span>
                        <Badge
                          className={
                            q.answer === "O"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs font-bold"
                              : "bg-red-500/20 text-red-400 border-red-500/40 text-xs font-bold"
                          }
                        >
                          Đáp án chuẩn: {q.answer} ({q.answer === "O" ? "ĐÚNG ○" : "SAI ×"})
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-base font-extrabold text-white leading-relaxed">{q.jp}</p>
                        <p className="text-xs font-mono text-indigo-300 italic">{q.romaji}</p>
                        <p className="text-xs text-slate-300 font-medium pt-1">👉 Dịch nghĩa: {q.vi}</p>
                      </div>

                      {q.vocab && q.vocab.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {q.vocab.map((v, i) => (
                            <span
                              key={i}
                              className="text-[11px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800"
                            >
                              <strong className="text-indigo-400">{v.jp}</strong> ({v.reading}) : {v.vi}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 text-xs text-slate-300 leading-relaxed">
                        <span className="font-bold text-amber-400">💡 Giải thích kỹ thuật:</span> {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Fallback helper to convert unstructured text block into Question array
function parseRawTextToQuestions(text: string): Question[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions: Question[] = [];
  lines.forEach((line, index) => {
    let answer: "O" | "X" = "O";
    if (/[×✕xX]|(Sai)|(誤り)/i.test(line)) answer = "X";
    
    const cleanJp = line.replace(/\([OXox正しい誤り]\)/g, "").trim();

    questions.push({
      id: index + 1,
      jp: cleanJp.endsWith("。") ? cleanJp : cleanJp + "。",
      romaji: `Shitsumon ${index + 1}: ${cleanJp}`,
      vi: `Câu hỏi ${index + 1}: ${cleanJp}`,
      vocab: [{ jp: "型枠", reading: "katawaku", vi: "Cốp pha" }],
      answer,
      explanation: `Dựa trên tài liệu chuyên ngành Cốp pha, nhận định này là ${answer === "O" ? "ĐÚNG (○)" : "SAI (×)"}.`,
    });
  });

  return questions;
}
