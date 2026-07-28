import { createClient, User } from "@supabase/supabase-js";
import { exams } from "@/data/exams";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gsiqvnlrqpopunrrktsz.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_1AJGBqA60AE8_qSUHTc6yQ_V54lihUR";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  updated_at?: string;
}

export interface ExamHistoryItem {
  id?: string;
  user_id: string;
  exam_id: string;
  exam_title: string;
  score: number;
  total: number;
  passed: boolean;
  score_pct: number;
  answers: Array<"O" | "X" | null>;
  finished_at: number;
  created_at?: string;
}

/**
 * Sign in with Google via Supabase OAuth
 */
export async function signInWithGoogle() {
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out user
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Sync user profile into 'profiles' table
 */
export async function syncUserProfile(user: User) {
  if (!user) return;
  try {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Thực tập sinh",
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) {
      console.warn("Notice syncing profile (make sure 'profiles' table exists in Supabase):", error.message || error);
    }
  } catch (err: any) {
    console.warn("Failed to sync profile:", err?.message || err);
  }
}

/**
 * Save exam result for authenticated user in 'exam_results' table
 */
export async function saveExamResult(userId: string, data: Omit<ExamHistoryItem, "user_id">) {
  try {
    const { error } = await supabase.from("exam_results").insert([
      {
        user_id: userId,
        exam_id: data.exam_id,
        exam_title: data.exam_title,
        score: data.score,
        total: data.total,
        passed: data.passed,
        score_pct: data.score_pct,
        answers: data.answers,
        finished_at: data.finished_at,
      },
    ]);

    if (error) console.warn("Notice saving exam result (make sure 'exam_results' table exists in Supabase):", error.message || error);
  } catch (err: any) {
    console.warn("Error in saveExamResult:", err?.message || err);
  }
}
/**
 * Sync any completed exam results stored in sessionStorage into Supabase database
 */
export async function syncSessionStorageExamResults(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("quiz:")) {
        const raw = sessionStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const exam = exams.find((e) => e.id === parsed.examId);
        if (!exam) continue;

        const answers: Array<"O" | "X" | null> = parsed.answers || [];
        let correct = 0;
        exam.questions.forEach((q, idx) => {
          if (answers[idx] === q.answer) correct += 1;
        });
        const total = exam.questions.length;
        const passThreshold = total === 20 ? 16 : Math.ceil(total * 0.8);
        const scorePct = Math.round((correct / total) * 100);
        const finishedAt = parsed.finishedAt || Date.now();

        await saveExamResult(userId, {
          exam_id: exam.id,
          exam_title: exam.title,
          score: correct,
          total,
          passed: correct >= passThreshold,
          score_pct: scorePct,
          answers,
          finished_at: finishedAt,
        });
      }
    }
  } catch (err) {
    console.warn("Failed to sync sessionStorage exam results:", err);
  }
}

/**
 * Fetch exam history for a user from 'exam_results' table
 */
export async function getUserExamHistory(userId: string): Promise<ExamHistoryItem[]> {
  try {
    // Automatically sync any unsaved sessionStorage exams first
    await syncSessionStorageExamResults(userId);

    const { data, error } = await supabase
      .from("exam_results")
      .select("*")
      .eq("user_id", userId)
      .order("finished_at", { ascending: false });

    if (error) {
      console.warn("Notice fetching exam history (make sure 'exam_results' table exists in Supabase):", error.message || error);
      return [];
    }

    return (data as ExamHistoryItem[]) || [];
  } catch (err) {
    console.error("Error fetching history:", err);
    return [];
  }
}
