import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile, parseDocumentToExam } from "@/nest/exam/document-parser";
import fs from "fs";
import path from "path";
import { Exam } from "@/data/exams";

const CUSTOM_EXAMS_PATH = path.join(process.cwd(), "src", "data", "custom_exams.json");

function readCustomExams(): Exam[] {
  try {
    if (fs.existsSync(CUSTOM_EXAMS_PATH)) {
      const content = fs.readFileSync(CUSTOM_EXAMS_PATH, "utf-8");
      return JSON.parse(content || "[]");
    }
  } catch (err) {
    console.error("Failed to read custom_exams.json", err);
  }
  return [];
}

function saveCustomExams(exams: Exam[]): void {
  try {
    const dir = path.dirname(CUSTOM_EXAMS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CUSTOM_EXAMS_PATH, JSON.stringify(exams, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save custom_exams.json", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn 1 file (.pdf, .doc, .docx)" },
        { status: 400 }
      );
    }

    const filename = file.name.toLowerCase();
    const isAllowed =
      filename.endsWith(".pdf") ||
      filename.endsWith(".doc") ||
      filename.endsWith(".docx") ||
      filename.endsWith(".txt");

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ file có định dạng .pdf, .doc, .docx hoặc .txt" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const rawText = await extractTextFromFile(buffer, file.name, file.type);
    const exam = await parseDocumentToExam(rawText, file.name, title);

    const existing = readCustomExams();
    const updated = [exam, ...existing.filter((e) => e.id !== exam.id)];
    saveCustomExams(updated);

    return NextResponse.json({
      message: `Tạo đề thi "${exam.title}" thành công từ file ${file.name}!`,
      exam,
      nestEngine: "NestJS Document Parser v2.5",
    });
  } catch (err: any) {
    console.error("Error in NestJS upload route:", err);
    return NextResponse.json(
      { error: err?.message || "Lỗi xử lý file PDF/DOC/DOCX" },
      { status: 500 }
    );
  }
}
