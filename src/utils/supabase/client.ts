import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gsiqvnlrqpopunrrktsz.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_1AJGBqA60AE8_qSUHTc6yQ_V54lihUR"
  );
}
