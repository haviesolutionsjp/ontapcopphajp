import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ExamService } from "./exam.service";
import { Exam } from "../../data/exams";

@Controller("api/nest")
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get("stats")
  getStats() {
    return this.examService.getDashboardStats();
  }

  @Get("exams")
  getAllExams() {
    return this.examService.getAllExams();
  }

  @Get("exams/:id")
  getExamById(@Param("id") id: string) {
    return this.examService.getExamById(id);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadDocument(
    @UploadedFile() file: any,
    @Body("title") title?: string
  ) {
    if (!file) {
      throw new BadRequestException("Vui lòng tải lên 1 file (.pdf, .doc, hoặc .docx)");
    }

    const filename = file.originalname.toLowerCase();
    const isAllowed =
      filename.endsWith(".pdf") ||
      filename.endsWith(".doc") ||
      filename.endsWith(".docx") ||
      filename.endsWith(".txt");

    if (!isAllowed) {
      throw new BadRequestException("Chỉ hỗ trợ tải file có định dạng .pdf, .doc, .docx hoặc .txt");
    }

    return this.examService.processUploadedDocument(file, title);
  }

  @Post("parse-text")
  @HttpCode(HttpStatus.OK)
  async parseText(@Body() body: { text: string; title?: string }) {
    if (!body.text || body.text.trim().length === 0) {
      throw new BadRequestException("Vui lòng nhập hoặc dán nội dung văn bản đề thi.");
    }
    return this.examService.parseTextToExam(body.text, body.title);
  }

  @Post("exams")
  createExam(@Body() examData: any) {
    if (!examData.title || !Array.isArray(examData.questions)) {
      throw new BadRequestException("Cấu trúc đề thi không hợp lệ. Cần có tiêu đề và danh sách câu hỏi.");
    }
    if (!examData.id) {
      examData.id = `exam-${Date.now()}`;
    }
    return this.examService.createExam(examData);
  }

  @Delete("exams/:id")
  deleteExam(@Param("id") id: string) {
    return this.examService.deleteExam(id);
  }
}
