import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exams as defaultExams, Exam } from "@/data/exams";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const custom = readCustomExams();
  const all = [...defaultExams, ...custom];
  const exam = all.find((e) => e.id === id);

  if (!exam) {
    return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });
  }
  return NextResponse.json(exam);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const custom = readCustomExams();
  const filtered = custom.filter((e) => e.id !== id);

  if (custom.length === filtered.length) {
    return NextResponse.json(
      { error: "Đề thi không tồn tại trong danh sách đề tự tạo hoặc là đề mặc định" },
      { status: 404 }
    );
  }

  saveCustomExams(filtered);
  return NextResponse.json({ success: true, message: `Đã xóa đề thi ${id}` });
}
