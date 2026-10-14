"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import type { TrainingFeedback } from "@/lib/types";

export type RequestTrainingState = { error: string | null; success: boolean };

export async function requestTrainingPlan(
  _prev: RequestTrainingState,
  formData: FormData
): Promise<RequestTrainingState> {
  const { profile, supabase } = await requireClient();

  const objetivo = String(formData.get("objetivo") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "");
  const lesiones = String(formData.get("lesiones") ?? "").trim();
  const sesiones = Number(formData.get("sesiones_semana") ?? 3);

  if (!objetivo) {
    return { error: "Falta el objetivo.", success: false };
  }

  const { data: ficha } = await supabase
    .from("health_profiles")
    .select("client_id")
    .eq("client_id", profile.id)
    .maybeSingle();
  if (!ficha) {
    return { error: "Primero llena tu ficha de salud.", success: false };
  }

  const { data: existing } = await supabase
    .from("training_plan_requests")
    .select("id")
    .eq("client_id", profile.id)
    .in("status", ["pendiente", "en_progreso"])
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      error: "Ya tienes una solicitud en trámite. Espera a que tu entrenador te asigne el plan.",
      success: false,
    };
  }

  // Si ya tuvo un plan de entrenamiento, el formulario pide cómo le fue para diseñar el siguiente.
  const { data: prevPlan } = await supabase
    .from("training_plans")
    .select("id")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let feedback: TrainingFeedback | null = null;
  if (prevPlan) {
    const dificultad = String(formData.get("dificultad") ?? "");
    const logrado = String(formData.get("objetivo_logrado") ?? "");
    if (
      !["muy_facil", "adecuada", "muy_dificil"].includes(dificultad) ||
      !["si", "parcial", "no"].includes(logrado)
    ) {
      return {
        error: "Cuéntanos cómo te fue con tu plan anterior (dificultad y si lograste tu objetivo).",
        success: false,
      };
    }
    const diasRaw = String(formData.get("dias_por_semana") ?? "").trim();
    const dias = Number(diasRaw);
    feedback = {
      dificultad: dificultad as TrainingFeedback["dificultad"],
      objetivo_logrado: logrado as TrainingFeedback["objetivo_logrado"],
      dias_por_semana: diasRaw !== "" && Number.isInteger(dias) && dias >= 0 && dias <= 7 ? dias : null,
      molestias: String(formData.get("molestias") ?? "").trim().slice(0, 1000) || null,
      comentarios: String(formData.get("comentarios") ?? "").trim().slice(0, 1000) || null,
    };
  }

  await supabase.from("training_plan_requests").insert({
    client_id: profile.id,
    objetivo,
    nivel,
    lesiones,
    sesiones_semana: sesiones,
    status: "pendiente",
    prev_plan_id: prevPlan?.id ?? null,
    feedback,
  });

  revalidatePath("/cliente/entrenamiento");
  return { error: null, success: true };
}

export type RequestNutritionState = { error: string | null; success: boolean };

export async function requestNutritionPlan(
  _prev: RequestNutritionState,
  formData: FormData
): Promise<RequestNutritionState> {
  const { profile, supabase } = await requireClient();

  const objetivo = String(formData.get("objetivo") ?? "").trim();
  const restricciones = String(formData.get("restricciones") ?? "").trim();
  const comidasDia = Number(formData.get("comidas_dia") ?? 4);
  const notas = String(formData.get("notas") ?? "").trim();

  if (!objetivo) {
    return { error: "Falta el objetivo.", success: false };
  }

  const { data: ficha } = await supabase
    .from("health_profiles")
    .select("client_id")
    .eq("client_id", profile.id)
    .maybeSingle();
  if (!ficha) {
    return { error: "Primero llena tu ficha de salud.", success: false };
  }

  const { data: existing } = await supabase
    .from("nutrition_plan_requests")
    .select("id")
    .eq("client_id", profile.id)
    .in("status", ["pendiente", "en_progreso"])
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      error: "Ya tienes una solicitud en trámite. Espera a que tu nutricionista te asigne el plan.",
      success: false,
    };
  }

  await supabase.from("nutrition_plan_requests").insert({
    client_id: profile.id,
    objetivo,
    restricciones: restricciones || null,
    comidas_dia: comidasDia,
    notas: notas || null,
    status: "pendiente",
  });

  revalidatePath("/cliente");
  return { error: null, success: true };
}

export type UploadPhotoState = { error: string | null; success: boolean };

export async function uploadProgressPhoto(
  _prev: UploadPhotoState,
  formData: FormData
): Promise<UploadPhotoState> {
  const { profile, supabase } = await requireClient();

  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una foto.", success: false };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen.", success: false };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("progress-photos")
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) {
    return { error: "No se pudo subir la foto.", success: false };
  }

  await supabase.from("progress_photos").insert({
    client_id: profile.id,
    storage_path: path,
    fecha: String(formData.get("fecha") ?? todayLocal()),
    notas: String(formData.get("notas") ?? "").trim() || null,
  });

  revalidatePath("/cliente/progreso");
  return { error: null, success: true };
}

export async function deleteOwnProgressPhoto(formData: FormData) {
  const { profile, supabase } = await requireClient();
  const id = String(formData.get("id") ?? "");
  const path = String(formData.get("path") ?? "");
  if (!id || !path) return;

  await supabase.storage.from("progress-photos").remove([path]);
  await supabase.from("progress_photos").delete().eq("id", id).eq("client_id", profile.id);

  revalidatePath("/cliente/progreso");
}
