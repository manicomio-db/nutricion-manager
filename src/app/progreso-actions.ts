"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/session";
import { todayLocal, addDays } from "@/lib/date";

export type LogWorkoutState = { error: string | null; success: boolean };

function numberOrNull(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Registra el peso y las repeticiones de un ejercicio. El cliente registra los
 * suyos; el admin puede registrar los de cualquier cliente (client_id oculto).
 */
export async function logWorkout(
  _prev: LogWorkoutState,
  formData: FormData
): Promise<LogWorkoutState> {
  const { profile, supabase } = await requireProfile();

  const isAdmin = profile.role === "admin";
  const clientId = isAdmin ? String(formData.get("client_id") ?? "") : profile.id;
  if (!clientId) return { error: "Falta el cliente.", success: false };

  const exercise = String(formData.get("exercise") ?? "").trim().slice(0, 80);
  if (!exercise) return { error: "Escribe o elige el ejercicio.", success: false };

  const today = todayLocal();
  const logDate = String(formData.get("log_date") ?? "") || today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate) || logDate > today || logDate < addDays(today, -730)) {
    return { error: "La fecha no es válida (no puede ser futura).", success: false };
  }

  const reps = numberOrNull(formData, "reps");
  if (reps === null || Number.isNaN(reps) || !Number.isInteger(reps) || reps < 1 || reps > 500) {
    return { error: "Las repeticiones deben ser un número entero de 1 a 500.", success: false };
  }

  const sets = numberOrNull(formData, "sets");
  if (sets !== null && (Number.isNaN(sets) || !Number.isInteger(sets) || sets < 1 || sets > 50)) {
    return { error: "Las series deben ser un número entero de 1 a 50.", success: false };
  }

  const weight = numberOrNull(formData, "weight_kg");
  if (weight !== null && (Number.isNaN(weight) || weight < 0 || weight > 1000)) {
    return { error: "El peso debe estar entre 0 y 1000 kg.", success: false };
  }

  // Cada registro queda ligado al plan de entrenamiento más reciente del cliente.
  const { data: plan } = await supabase
    .from("training_plans")
    .select("id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("workout_logs").insert({
    client_id: clientId,
    plan_id: plan?.id ?? null,
    exercise,
    log_date: logDate,
    sets,
    reps,
    weight_kg: weight,
    logged_by: profile.id,
  });

  if (error) {
    console.error("logWorkout error:", error);
    return { error: "No se pudo guardar el registro. Intenta de nuevo.", success: false };
  }

  revalidatePath("/cliente/entrenamiento");
  revalidatePath(`/admin/clientes/${clientId}`);

  return { error: null, success: true };
}

export async function deleteWorkoutLog(formData: FormData) {
  const { supabase } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  if (!id) return;

  // RLS asegura que solo se borre un registro propio (o cualquiera si es admin).
  await supabase.from("workout_logs").delete().eq("id", id);

  revalidatePath("/cliente/entrenamiento");
  if (clientId) revalidatePath(`/admin/clientes/${clientId}`);
}
