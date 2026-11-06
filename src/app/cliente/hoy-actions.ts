"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { GLASS_ML } from "@/lib/water";
import { mealTotals } from "@/lib/daily";
import type { MealItem, NutritionPlan } from "@/lib/types";

export type ActionResult = { error: string | null };

function refresh() {
  revalidatePath("/cliente/hoy");
  revalidatePath("/cliente");
}

/** Marca (o desmarca) una comida del plan como cumplida el día de hoy. */
export async function toggleMeal(mealIndex: number, done: boolean): Promise<ActionResult> {
  const { profile, supabase } = await requireClient();
  const today = todayLocal();

  const { data: plan } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<NutritionPlan>();

  const meal = plan?.comidas[mealIndex];
  if (!plan || !meal) return { error: "No se encontró esa comida en tu plan." };

  // Una sola entrada por comida y día.
  await supabase
    .from("meal_logs")
    .delete()
    .eq("client_id", profile.id)
    .eq("log_date", today)
    .eq("meal_index", mealIndex);

  if (done) {
    const t = mealTotals(meal);
    const { error } = await supabase.from("meal_logs").insert({
      client_id: profile.id,
      log_date: today,
      plan_id: plan.id,
      meal_index: mealIndex,
      meal_name: meal.nombre,
      kind: "plan",
      kcal: t.kcal,
      proteina: t.proteina,
      carbos: t.carbos,
      grasas: t.grasas,
      items: meal.items,
    });
    if (error) {
      console.error("toggleMeal error:", error);
      return { error: "No se pudo guardar. Intenta de nuevo." };
    }
  }

  refresh();
  return { error: null };
}

export type DifferentMealInput = {
  /** Índice de la comida del plan que sustituye; null si es una comida extra. */
  mealIndex: number | null;
  descripcion: string;
  items: MealItem[];
};

function num(n: unknown, max: number): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(max, Math.round(v * 10) / 10);
}

/** Registra una comida distinta a la del plan (o una comida extra) con su desglose. */
export async function saveDifferentMeal(input: DifferentMealInput): Promise<ActionResult> {
  const { profile, supabase } = await requireClient();
  const today = todayLocal();

  const descripcion = String(input.descripcion ?? "").trim().slice(0, 400);
  if (!descripcion) return { error: "Describe qué comiste." };

  const items: MealItem[] = (input.items ?? []).slice(0, 15).map((i) => ({
    food_id: null,
    food_nombre: String(i.food_nombre ?? "").trim().slice(0, 80),
    gramos: num(i.gramos, 5000),
    kcal: num(i.kcal, 5000),
    proteina: num(i.proteina, 500),
    carbos: num(i.carbos, 1000),
    grasas: num(i.grasas, 500),
  }));
  if (items.length === 0) return { error: "Primero calcula el desglose de tu comida." };

  const total = items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      proteina: acc.proteina + i.proteina,
      carbos: acc.carbos + i.carbos,
      grasas: acc.grasas + i.grasas,
    }),
    { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
  );

  let mealName = "Comida extra";
  let planId: string | null = null;
  const kind = input.mealIndex === null ? "extra" : "otra";

  if (input.mealIndex !== null) {
    const { data: plan } = await supabase
      .from("nutrition_plans")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<NutritionPlan>();
    const meal = plan?.comidas[input.mealIndex];
    if (!plan || !meal) return { error: "No se encontró esa comida en tu plan." };
    mealName = meal.nombre;
    planId = plan.id;

    // Reemplaza lo que hubiera marcado antes para esa comida.
    await supabase
      .from("meal_logs")
      .delete()
      .eq("client_id", profile.id)
      .eq("log_date", today)
      .eq("meal_index", input.mealIndex);
  } else {
    // Tope razonable de comidas extra por día.
    const { count } = await supabase
      .from("meal_logs")
      .select("id", { count: "exact", head: true })
      .eq("client_id", profile.id)
      .eq("log_date", today)
      .eq("kind", "extra");
    if ((count ?? 0) >= 15) return { error: "Llegaste al máximo de comidas extra de hoy." };
  }

  const { error } = await supabase.from("meal_logs").insert({
    client_id: profile.id,
    log_date: today,
    plan_id: planId,
    meal_index: input.mealIndex,
    meal_name: mealName,
    kind,
    descripcion,
    kcal: Math.round(total.kcal * 10) / 10,
    proteina: Math.round(total.proteina * 10) / 10,
    carbos: Math.round(total.carbos * 10) / 10,
    grasas: Math.round(total.grasas * 10) / 10,
    items,
  });
  if (error) {
    console.error("saveDifferentMeal error:", error);
    return { error: "No se pudo guardar. Intenta de nuevo." };
  }

  refresh();
  return { error: null };
}

export async function deleteMealLog(id: string): Promise<ActionResult> {
  const { supabase } = await requireClient();
  if (!id) return { error: "Falta el registro." };
  // RLS asegura que solo se borre un registro propio.
  await supabase.from("meal_logs").delete().eq("id", id);
  refresh();
  return { error: null };
}

/** Suma o resta vasos de agua (de 250 ml) al día de hoy. */
export async function addWater(glasses: number): Promise<ActionResult> {
  const { profile, supabase } = await requireClient();
  const today = todayLocal();
  const delta = Math.trunc(glasses);
  if (!delta || Math.abs(delta) > 40) return { error: null };

  const { data: row } = await supabase
    .from("water_logs")
    .select("ml")
    .eq("client_id", profile.id)
    .eq("log_date", today)
    .maybeSingle<{ ml: number }>();

  const ml = Math.min(10000, Math.max(0, (row?.ml ?? 0) + delta * GLASS_ML));

  const { error } = await supabase.from("water_logs").upsert(
    { client_id: profile.id, log_date: today, ml, updated_at: new Date().toISOString() },
    { onConflict: "client_id,log_date" }
  );
  if (error) {
    console.error("addWater error:", error);
    return { error: "No se pudo guardar. Intenta de nuevo." };
  }

  refresh();
  return { error: null };
}
