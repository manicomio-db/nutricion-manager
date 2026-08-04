"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isEmail, usernameToEmail } from "@/lib/username";

export type AuthState = { error: string | null };

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const email = isEmail(identifier) ? identifier : usernameToEmail(identifier);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Usuario/correo o contraseña incorrectos." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  redirect(profile?.role === "admin" ? "/admin" : "/cliente");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
