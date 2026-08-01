import { NextResponse } from "next/server";
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

export async function GET() {
  const custom = readCustomExams();
  const allMap = new Map<string, Exam>();
  defaultExams.forEach((e) => allMap.set(e.id, e));
  custom.forEach((e) => allMap.set(e.id, e));
  const all = Array.from(allMap.values());

  const totalQuestions = all.reduce((acc, e) => acc + (e.questions?.length || 0), 0);
  const customQuestions = custom.reduce((acc, e) => acc + (e.questions?.length || 0), 0);

  return NextResponse.json(
    {
      totalExams: all.length,
      defaultExamsCount: defaultExams.length,
      customExamsCount: custom.length,
      totalQuestions,
      customQuestions,
      supportedFormats: [".pdf", ".doc", ".docx", ".txt"],
      nestjsStatus: "Online",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
