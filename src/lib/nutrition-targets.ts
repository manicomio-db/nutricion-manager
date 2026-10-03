export type Actividad = "sedentario" | "ligero" | "moderado" | "intenso";
export type Ajuste = "perder_grasa" | "mantener" | "ganar_musculo";

export const ACTIVIDAD_LABEL: Record<Actividad, string> = {
  sedentario: "Sedentario (poco o nada de ejercicio)",
  ligero: "Ligero (1-3 días/semana)",
  moderado: "Moderado (3-5 días/semana)",
  intenso: "Intenso (6-7 días/semana)",
};

export const AJUSTE_LABEL: Record<Ajuste, string> = {
  perder_grasa: "Perder grasa (déficit ~20%)",
  mantener: "Mantener",
  ganar_musculo: "Ganar músculo (superávit ~10%)",
};

const ACTIVIDAD_FACTOR: Record<Actividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  intenso: 1.725,
};

const AJUSTE_FACTOR: Record<Ajuste, number> = {
  perder_grasa: 0.8,
  mantener: 1,
  ganar_musculo: 1.1,
};

// g de proteína por kg de masa magra (o por kg de peso si no hay % de grasa)
const PROTEINA_G_KG_MAGRA: Record<Ajuste, number> = {
  perder_grasa: 2.4,
  mantener: 2.0,
  ganar_musculo: 2.2,
};
const PROTEINA_G_KG_PESO: Record<Ajuste, number> = {
  perder_grasa: 2.0,
  mantener: 1.6,
  ganar_musculo: 1.8,
};

export type Metas = { kcal: number; proteina: number; carbos: number; grasas: number };

export type TargetInput = {
  pesoKg: number | null | undefined;
  grasaPct: number | null | undefined;
  tasaMetabolicaKcal: number | null | undefined;
  actividad: Actividad;
  ajuste: Ajuste;
};

// Infiere el ajuste a partir del texto libre del objetivo del cliente.
export function inferAjuste(objetivo: string): Ajuste {
  const t = objetivo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (/(grasa|bajar|perder|definir|defin|adelgaz|peso)/.test(t)) return "perder_grasa";
  if (/(musculo|masa|ganar|volumen|aumentar|fuerza)/.test(t)) return "ganar_musculo";
  return "mantener";
}

// Calcula metas diarias. Devuelve null si no hay datos suficientes (peso).
export function computeTargets(input: TargetInput): Metas | null {
  const { pesoKg, grasaPct, tasaMetabolicaKcal, actividad, ajuste } = input;
  if (!pesoKg || pesoKg <= 0) return null;

  const masaMagra = grasaPct && grasaPct > 0 && grasaPct < 70 ? pesoKg * (1 - grasaPct / 100) : null;

  // Metabolismo basal: el del InBody si existe; si no, Katch-McArdle con masa magra.
  let bmr: number | null = null;
  if (tasaMetabolicaKcal && tasaMetabolicaKcal > 0) bmr = tasaMetabolicaKcal;
  else if (masaMagra) bmr = 370 + 21.6 * masaMagra;
  if (!bmr) return null;

  const kcal = Math.round(bmr * ACTIVIDAD_FACTOR[actividad] * AJUSTE_FACTOR[ajuste]);

  const proteina = Math.round(
    masaMagra ? masaMagra * PROTEINA_G_KG_MAGRA[ajuste] : pesoKg * PROTEINA_G_KG_PESO[ajuste]
  );
  const grasas = Math.round((kcal * 0.25) / 9);
  const carbos = Math.max(0, Math.round((kcal - proteina * 4 - grasas * 9) / 4));

  return { kcal, proteina, carbos, grasas };
}
