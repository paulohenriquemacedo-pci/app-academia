import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://toaghlccpdjtxswuzfjt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYWdobGNjcGRqdHhzd3V6Zmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDY0MDYsImV4cCI6MjA5NjE4MjQwNn0.FBvoaxIUrNWDwqSnjVk9iksmiXhMc9yPdLfD_wYSUyU";

export const MAIN_SITE_URL = "https://app.sistemaacademia.com.br";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "academia-os-auth",
  },
});

export type OnboardingStep = "questionnaire" | "energy_tracking" | "complete";

export async function fetchOnboardingStep(userId: string): Promise<OnboardingStep> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("onboarding_step")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      // Tabela/coluna pode não existir ainda — fallback seguro.
      console.warn("[academia-os] user_profiles indisponível:", error.message);
      return "questionnaire";
    }
    const step = data?.onboarding_step as OnboardingStep | undefined;
    if (step === "complete" || step === "energy_tracking" || step === "questionnaire") {
      return step;
    }
    return "questionnaire";
  } catch (e) {
    console.warn("[academia-os] erro ao buscar perfil:", e);
    return "questionnaire";
  }
}

export function routeForStep(step: OnboardingStep): string {
  if (step === "complete") return "/dashboard";
  if (step === "energy_tracking") return "/onboarding/energy";
  return "/onboarding";
}