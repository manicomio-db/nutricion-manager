"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/supabase/session";

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

  await supabase.from("training_plan_requests").insert({
    client_id: profile.id,
    objetivo,
    nivel,
    lesiones,
    sesiones_semana: sesiones,
    status: "pendiente",
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
