import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { exams as defaultExams, Exam } from "../../data/exams";
import { extractTextFromFile, parseDocumentToExam } from "./document-parser";

const CUSTOM_EXAMS_PATH = path.join(process.cwd(), "src", "data", "custom_exams.json");

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  private readCustomExams(): Exam[] {
    try {
      if (fs.existsSync(CUSTOM_EXAMS_PATH)) {
        const content = fs.readFileSync(CUSTOM_EXAMS_PATH, "utf-8");
        return JSON.parse(content || "[]");
      }
    } catch (err: any) {
      this.logger.error("Failed to read custom_exams.json", err.stack);
    }
    return [];
  }

  private saveCustomExams(exams: Exam[]): void {
    try {
      const dir = path.dirname(CUSTOM_EXAMS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CUSTOM_EXAMS_PATH, JSON.stringify(exams, null, 2), "utf-8");
    } catch (err: any) {
      this.logger.error("Failed to save custom_exams.json", err.stack);
    }
  }

  getAllExams(): Exam[] {
    const customExams = this.readCustomExams();
    const map = new Map<string, Exam>();
    defaultExams.forEach((e) => map.set(e.id, e));
    customExams.forEach((e) => map.set(e.id, e));
    return Array.from(map.values());
  }

  getExamById(id: string): Exam {
    const all = this.getAllExams();
    const exam = all.find((e) => e.id === id);
    if (!exam) {
      throw new NotFoundException(`Exam with ID "${id}" not found.`);
    }
    return exam;
  }

  async processUploadedDocument(
    file: { originalname: string; buffer: Buffer; mimetype?: string; size?: number },
    customTitle?: string
  ): Promise<{ message: string; exam: Exam }> {
    this.logger.log(`Processing uploaded document: ${file.originalname} (${file.size} bytes)`);

    const rawText = await extractTextFromFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const exam = await parseDocumentToExam(
      rawText,
      file.originalname,
      customTitle
    );

    // Save to custom exams file
    const existing = this.readCustomExams();
    const updated = [exam, ...existing.filter((e) => e.id !== exam.id)];
    this.saveCustomExams(updated);

    return {
      message: `Tạo đề thi "${exam.title}" thành công từ file ${file.originalname}!`,
      exam,
    };
  }

  async parseTextToExam(text: string, title?: string): Promise<{ message: string; exam: Exam }> {
    const examName = title || "Đề thi từ văn bản trích xuất";
    const exam = await parseDocumentToExam(text, "raw-text.txt", examName);

    const existing = this.readCustomExams();
    const updated = [exam, ...existing.filter((e) => e.id !== exam.id)];
    this.saveCustomExams(updated);

    return {
      message: `Tạo thành công đề thi "${exam.title}" gồm ${exam.questions.length} câu hỏi.`,
      exam,
    };
  }

  createExam(examData: Exam): Exam {
    const existing = this.readCustomExams();
    const updated = [examData, ...existing.filter((e) => e.id !== examData.id)];
    this.saveCustomExams(updated);
    return examData;
  }

  deleteExam(id: string): { success: boolean; message: string } {
    const existing = this.readCustomExams();
    const filtered = existing.filter((e) => e.id !== id);
    if (existing.length === filtered.length) {
      throw new NotFoundException(`Custom exam with ID "${id}" does not exist or is a default built-in exam.`);
    }
    this.saveCustomExams(filtered);
    return { success: true, message: `Đã xóa đề thi ${id} khỏi hệ thống NestJS Dashboard.` };
  }

  getDashboardStats() {
    const all = this.getAllExams();
    const custom = this.readCustomExams();

    const totalQuestions = all.reduce((acc, e) => acc + (e.questions?.length || 0), 0);
    const customQuestions = custom.reduce((acc, e) => acc + (e.questions?.length || 0), 0);

    return {
      totalExams: all.length,
      defaultExamsCount: defaultExams.length,
      customExamsCount: custom.length,
      totalQuestions,
      customQuestions,
      supportedFormats: [".pdf", ".doc", ".docx", ".txt"],
      nestjsStatus: "Online",
      timestamp: new Date().toISOString(),
    };
  }
}
