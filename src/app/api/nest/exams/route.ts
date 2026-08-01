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

export async function GET() {
  const custom = readCustomExams();
  const map = new Map<string, Exam>();
  defaultExams.forEach((e) => map.set(e.id, e));
  custom.forEach((e) => map.set(e.id, e));
  return NextResponse.json(Array.from(map.values()));
}

export async function POST(req: NextRequest) {
  try {
    const examData: Exam = await req.json();
    if (!examData.title || !Array.isArray(examData.questions)) {
      return NextResponse.json(
        { error: "Đề thi không hợp lệ" },
        { status: 400 }
      );
    }
    if (!examData.id) {
      examData.id = `exam-${Date.now()}`;
    }

    const existing = readCustomExams();
    const updated = [examData, ...existing.filter((e) => e.id !== examData.id)];
    saveCustomExams(updated);

    return NextResponse.json(examData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
