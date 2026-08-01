import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const logger = new Logger("NestDashboard");
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  const port = process.env.NEST_PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 NestJS Exam Dashboard Server running on http://localhost:${port}`);
  logger.log(`📄 API Endpoints: http://localhost:${port}/api/nest/stats & http://localhost:${port}/api/nest/upload`);
}

bootstrap().catch((err) => {
  console.error("Failed to start NestJS Server:", err);
});
