import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { redirect } from "next/navigation";

export async function requireProfile(): Promise<{ profile: Profile; supabase: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return { profile: profile as Profile, supabase };
}

export async function requireAdmin(): Promise<{ profile: Profile; supabase: Awaited<ReturnType<typeof createClient>> }> {
  const { profile, supabase } = await requireProfile();
  if (profile.role !== "admin") redirect("/cliente");
  return { profile, supabase };
}

export async function requireClient(): Promise<{ profile: Profile; supabase: Awaited<ReturnType<typeof createClient>> }> {
  const { profile, supabase } = await requireProfile();
  if (profile.role !== "cliente") redirect("/admin");
  return { profile, supabase };
}
