import { exams as defaultExams, Exam, Question } from "./exams";
import customExamsData from "./custom_exams.json";

export type { Exam, Question };

// Helper to safely fetch custom exams from API or local storage
export function getCustomExamsFromStorage(): Exam[] {
  if (typeof window === "undefined") {
    return (customExamsData as unknown as Exam[]) || [];
  }
  try {
    const stored = localStorage.getItem("nestjs_custom_exams");
    const localExams: Exam[] = stored ? JSON.parse(stored) : [];
    const fileExams = (customExamsData as unknown as Exam[]) || [];
    
    // Deduplicate by ID
    const examMap = new Map<string, Exam>();
    fileExams.forEach((e) => examMap.set(e.id, e));
    localExams.forEach((e) => examMap.set(e.id, e));
    
    return Array.from(examMap.values());
  } catch (err) {
    console.error("Failed to read custom exams from storage", err);
    return (customExamsData as unknown as Exam[]) || [];
  }
}

export function saveCustomExamToStorage(newExam: Exam): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getCustomExamsFromStorage();
    const updated = [newExam, ...existing.filter((e) => e.id !== newExam.id)];
    localStorage.setItem("nestjs_custom_exams", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save custom exam to local storage", err);
  }
}

export function deleteCustomExamFromStorage(examId: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getCustomExamsFromStorage();
    const updated = existing.filter((e) => e.id !== examId);
    localStorage.setItem("nestjs_custom_exams", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete custom exam from local storage", err);
  }
}

export function getAllExams(customExams: Exam[] = []): Exam[] {
  const mergedCustom = [...customExams];
  if (typeof window !== "undefined") {
    const fromStorage = getCustomExamsFromStorage();
    fromStorage.forEach((st) => {
      if (!mergedCustom.some((c) => c.id === st.id)) {
        mergedCustom.push(st);
      }
    });
  }
  return [...defaultExams, ...mergedCustom];
}

export function getExamById(id: string, customExams: Exam[] = []): Exam | undefined {
  const all = getAllExams(customExams);
  return all.find((e) => e.id === id);
}
