"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { isEmail, normalizeUsername, usernameToEmail } from "@/lib/username";

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

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const usernameRaw = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const username = normalizeUsername(usernameRaw);
  if (!fullName) {
    return { error: "Escribe tu nombre completo." };
  }
  if (!username) {
    return { error: "Escribe un nombre de usuario válido (letras, números, puntos o guiones)." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, telefono, username, role: "cliente" },
  });

  if (error || !data.user) {
    const message =
      error?.message.includes("already been registered") || error?.message.includes("already exists")
        ? "Ese nombre de usuario ya está en uso."
        : error?.message ?? "No se pudo crear la cuenta.";
    return { error: message };
  }

  await admin
    .from("profiles")
    .update({ role: "cliente", full_name: fullName, telefono, username })
    .eq("id", data.user.id);

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (signInError) {
    redirect("/login");
  }

  redirect("/cliente");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
