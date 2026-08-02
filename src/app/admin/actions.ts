"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayLocal } from "@/lib/date";
import type { Meal, TrainingPlanContent } from "@/lib/types";

// --- Alimentos ----------------------------------------------------------------

export async function upsertFood(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payload = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    kcal_100g: Number(formData.get("kcal_100g") ?? 0),
    proteina_100g: Number(formData.get("proteina_100g") ?? 0),
    carbos_100g: Number(formData.get("carbos_100g") ?? 0),
    grasas_100g: Number(formData.get("grasas_100g") ?? 0),
    fuente: String(formData.get("fuente") ?? "manual"),
  };
  if (!payload.nombre) return;

  if (id) {
    await supabase.from("foods").update(payload).eq("id", id);
  } else {
    await supabase.from("foods").insert(payload);
  }
  revalidatePath("/admin/alimentos");
}

export async function deleteFood(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await supabase.from("foods").delete().eq("id", id);
  revalidatePath("/admin/alimentos");
}

// --- Aprender: categorías y tips -------------------------------------------------

export async function upsertTipCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payload = {
    titulo: String(formData.get("titulo") ?? "").trim(),
    orden: Number(formData.get("orden") ?? 0) || 0,
  };
  if (!payload.titulo) return;

  if (id) {
    await supabase.from("tip_categories").update(payload).eq("id", id);
  } else {
    await supabase.from("tip_categories").insert(payload);
  }
  revalidatePath("/admin/tips");
  revalidatePath("/cliente/aprender");
}

export async function deleteTipCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await supabase.from("tip_categories").delete().eq("id", id);
  revalidatePath("/admin/tips");
  revalidatePath("/cliente/aprender");
}

export async function upsertTip(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payload = {
    category_id: String(formData.get("category_id") ?? "") || null,
    emoji: String(formData.get("emoji") ?? "").trim() || null,
    titulo: String(formData.get("titulo") ?? "").trim(),
    contenido: String(formData.get("contenido") ?? "").trim(),
    orden: Number(formData.get("orden") ?? 0) || 0,
  };
  if (!payload.titulo || !payload.contenido || !payload.category_id) return;

  if (id) {
    await supabase.from("tips").update(payload).eq("id", id);
  } else {
    await supabase.from("tips").insert(payload);
  }
  revalidatePath("/admin/tips");
  revalidatePath("/cliente/aprender");
}

export async function deleteTip(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await supabase.from("tips").delete().eq("id", id);
  revalidatePath("/admin/tips");
  revalidatePath("/cliente/aprender");
}

// --- Clientes -------------------------------------------------------------------

export type CreateClientState = { error: string | null; success?: boolean };

export async function createClientAccount(
  _prev: CreateClientState,
  formData: FormData
): Promise<CreateClientState> {
  await requireAdmin();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "cliente" },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "No se pudo crear la cuenta." };
  }

  await admin
    .from("profiles")
    .update({ role: "cliente", full_name: fullName })
    .eq("id", data.user.id);

  revalidatePath("/admin");
  return { error: null, success: true };
}

export async function updateClientProfile(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const payload = {
    full_name: String(formData.get("full_name") ?? "").trim(),
    objetivo: String(formData.get("objetivo") ?? "").trim() || null,
    restricciones: String(formData.get("restricciones") ?? "").trim() || null,
    altura_cm: Number(formData.get("altura_cm") ?? 0) || null,
    notas: String(formData.get("notas") ?? "").trim() || null,
  };

  await supabase.from("profiles").update(payload).eq("id", id);
  revalidatePath(`/admin/clientes/${id}`);
}

export async function deleteClient(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id);

  revalidatePath("/admin");
}

// --- Planes -----------------------------------------------------------------

export async function savePlan(input: { clientId: string; title: string; comidas: Meal[] }) {
  const { supabase } = await requireAdmin();
  await supabase.from("nutrition_plans").insert({
    client_id: input.clientId,
    title: input.title,
    comidas: input.comidas,
  });
  revalidatePath(`/admin/clientes/${input.clientId}`);
}

export async function updatePlan(input: { id: string; clientId: string; title: string; comidas: Meal[] }) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("nutrition_plans")
    .update({ title: input.title, comidas: input.comidas })
    .eq("id", input.id);
  revalidatePath(`/admin/clientes/${input.clientId}`);
}

export async function deletePlan(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  await supabase.from("nutrition_plans").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clientId}`);
}

// --- Progreso -----------------------------------------------------------------

export async function addProgressLog(formData: FormData) {
  const { supabase } = await requireAdmin();
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return;

  const medidas = {
    cintura: Number(formData.get("cintura") ?? 0) || undefined,
    cadera: Number(formData.get("cadera") ?? 0) || undefined,
    brazo: Number(formData.get("brazo") ?? 0) || undefined,
    pecho: Number(formData.get("pecho") ?? 0) || undefined,
  };

  await supabase.from("progress_logs").insert({
    client_id: clientId,
    fecha: String(formData.get("fecha") ?? todayLocal()),
    peso_kg: Number(formData.get("peso_kg") ?? 0) || null,
    grasa_pct: Number(formData.get("grasa_pct") ?? 0) || null,
    medidas,
    notas: String(formData.get("notas") ?? "").trim() || null,
    masa_muscular_kg: Number(formData.get("masa_muscular_kg") ?? 0) || null,
    masa_grasa_kg: Number(formData.get("masa_grasa_kg") ?? 0) || null,
    grasa_visceral: Number(formData.get("grasa_visceral") ?? 0) || null,
    agua_corporal_l: Number(formData.get("agua_corporal_l") ?? 0) || null,
    tasa_metabolica_kcal: Number(formData.get("tasa_metabolica_kcal") ?? 0) || null,
  });

  revalidatePath(`/admin/clientes/${clientId}`);
}

export async function deleteProgressLog(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  await supabase.from("progress_logs").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clientId}`);
}

// --- Entrenamiento --------------------------------------------------------------

export async function saveTrainingPlan(input: {
  requestId: string | null;
  clientId: string;
  title: string;
  contenido: TrainingPlanContent;
  source: "ia" | "manual";
}) {
  const { profile, supabase } = await requireAdmin();

  await supabase.from("training_plans").insert({
    client_id: input.clientId,
    admin_id: profile.id,
    request_id: input.requestId,
    title: input.title,
    contenido: input.contenido,
    source: input.source,
  });

  if (input.requestId) {
    await supabase
      .from("training_plan_requests")
      .update({ status: "completado" })
      .eq("id", input.requestId);
  }

  revalidatePath(`/admin/clientes/${input.clientId}`);
}

export async function markTrainingInProgress(formData: FormData) {
  const { supabase } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  await supabase.from("training_plan_requests").update({ status: "en_progreso" }).eq("id", requestId);
  revalidatePath(`/admin/clientes/${clientId}`);
}

export async function discardTrainingRequest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  await supabase.from("training_plan_requests").delete().eq("id", requestId);
  revalidatePath(`/admin/clientes/${clientId}`);
}

export async function deleteTrainingPlan(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  await supabase.from("training_plans").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clientId}`);
}

// --- Solicitudes de plan nutricional (generado por IA) -------------------------

export async function saveNutritionPlanFromRequest(input: {
  requestId: string | null;
  clientId: string;
  title: string;
  comidas: Meal[];
  source: "ia" | "manual";
}) {
  const { profile, supabase } = await requireAdmin();

  await supabase.from("nutrition_plans").insert({
    client_id: input.clientId,
    admin_id: profile.id,
    request_id: input.requestId,
    title: input.title,
    comidas: input.comidas,
    source: input.source,
  });

  if (input.requestId) {
    await supabase
      .from("nutrition_plan_requests")
      .update({ status: "completado" })
      .eq("id", input.requestId);
  }

  revalidatePath(`/admin/clientes/${input.clientId}`);
}

export async function markNutritionInProgress(formData: FormData) {
  const { supabase } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  await supabase.from("nutrition_plan_requests").update({ status: "en_progreso" }).eq("id", requestId);
  revalidatePath(`/admin/clientes/${clientId}`);
}

export async function discardNutritionRequest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  await supabase.from("nutrition_plan_requests").delete().eq("id", requestId);
  revalidatePath(`/admin/clientes/${clientId}`);
}
