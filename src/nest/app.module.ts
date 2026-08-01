import { Module } from "@nestjs/common";
import { ExamModule } from "./exam/exam.module";

@Module({
  imports: [ExamModule],
})
export class AppModule {}
