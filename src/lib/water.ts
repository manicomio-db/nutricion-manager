import { inferAjuste, type Ajuste } from "@/lib/nutrition-targets";

export const GLASS_ML = 250;

export type WaterGoal = {
  ml: number;
  glasses: number;
  /** Cómo se llegó a esa cantidad, en líneas cortas para mostrar al cliente. */
  breakdown: string[];
  /** Aviso cuando por su salud conviene que lo confirme su médico. */
  caution: string | null;
};

const ACTIVITY_EXTRA_ML: Record<string, number> = {
  sedentario: 0,
  ligero: 250,
  moderado: 500,
  activo: 750,
};

const AJUSTE_EXTRA_ML: Record<Ajuste, number> = {
  perder_grasa: 300,
  mantener: 0,
  ganar_musculo: 300,
};

const AJUSTE_LABEL: Record<Ajuste, string> = {
  perder_grasa: "perder grasa",
  mantener: "mantener",
  ganar_musculo: "ganar músculo",
};

/**
 * Requerimiento diario de agua. Es una guía general: base según masa magra (si hay
 * % de grasa) o peso, más un extra por actividad física y por objetivo.
 */
export function computeWaterGoal(input: {
  pesoKg: number | null | undefined;
  grasaPct: number | null | undefined;
  actividad: string | null | undefined;
  objetivo: string | null | undefined;
  conditions?: string[];
}): WaterGoal | null {
  const { pesoKg, grasaPct, actividad, objetivo, conditions = [] } = input;
  if (!pesoKg || pesoKg <= 0) return null;

  const breakdown: string[] = [];

  let base: number;
  if (grasaPct && grasaPct > 0 && grasaPct < 70) {
    const magra = Math.round(pesoKg * (1 - grasaPct / 100) * 10) / 10;
    base = magra * 45;
    breakdown.push(`Base: ${magra} kg de masa magra × 45 ml = ${Math.round(base)} ml`);
  } else {
    base = pesoKg * 35;
    breakdown.push(`Base: ${pesoKg} kg de peso × 35 ml = ${Math.round(base)} ml`);
  }

  const actExtra = actividad ? (ACTIVITY_EXTRA_ML[actividad] ?? 250) : 250;
  if (actExtra > 0) breakdown.push(`Actividad física: +${actExtra} ml`);

  const ajuste = inferAjuste(objetivo ?? "");
  const objExtra = AJUSTE_EXTRA_ML[ajuste];
  if (objExtra > 0) {
    breakdown.push(`Objetivo (${AJUSTE_LABEL[ajuste]}, más proteína y metabolismo): +${objExtra} ml`);
  }

  const total = base + actExtra + objExtra;
  const clamped = Math.min(5000, Math.max(1500, total));
  const ml = Math.round(clamped / GLASS_ML) * GLASS_ML;

  const caution =
    conditions.includes("renal") || conditions.includes("cardiaco")
      ? "Por tu condición de salud, confirma con tu médico cuánta agua puedes tomar al día."
      : null;

  return { ml, glasses: Math.round(ml / GLASS_ML), breakdown, caution };
}
