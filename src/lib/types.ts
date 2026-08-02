export type Role = "admin" | "cliente";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  objetivo: string | null;
  restricciones: string | null;
  altura_cm: number | null;
  notas: string | null;
  created_at: string;
};

export type TipCategory = {
  id: string;
  titulo: string;
  orden: number;
  created_at: string;
};

export type Tip = {
  id: string;
  category_id: string | null;
  emoji: string | null;
  titulo: string;
  contenido: string;
  orden: number;
  created_at: string;
};

export type FoodSource = "manual" | "ia";

export type Food = {
  id: string;
  nombre: string;
  kcal_100g: number;
  proteina_100g: number;
  carbos_100g: number;
  grasas_100g: number;
  fuente: FoodSource;
  created_at: string;
};

export type MealItem = {
  food_id: string | null;
  food_nombre: string;
  gramos: number;
  kcal: number;
  proteina: number;
  carbos: number;
  grasas: number;
};

export type Meal = {
  nombre: string;
  items: MealItem[];
};

export type NutritionPlan = {
  id: string;
  client_id: string;
  admin_id: string | null;
  request_id: string | null;
  title: string;
  comidas: Meal[];
  source: "ia" | "manual";
  created_at: string;
};

export type NutritionRequestStatus = "pendiente" | "en_progreso" | "completado";

export type NutritionPlanRequest = {
  id: string;
  client_id: string;
  objetivo: string;
  restricciones: string | null;
  comidas_dia: number | null;
  notas: string | null;
  status: NutritionRequestStatus;
  created_at: string;
};

export type Medidas = {
  cintura?: number;
  cadera?: number;
  brazo?: number;
  pecho?: number;
};

export type ProgressLog = {
  id: string;
  client_id: string;
  fecha: string;
  peso_kg: number | null;
  grasa_pct: number | null;
  medidas: Medidas | null;
  notas: string | null;
  created_at: string;
  masa_muscular_kg: number | null;
  masa_grasa_kg: number | null;
  grasa_visceral: number | null;
  agua_corporal_l: number | null;
  tasa_metabolica_kcal: number | null;
};

export type TrainingRequestStatus = "pendiente" | "en_progreso" | "completado";

export type TrainingPlanRequest = {
  id: string;
  client_id: string;
  objetivo: string;
  nivel: string | null;
  lesiones: string | null;
  sesiones_semana: number | null;
  status: TrainingRequestStatus;
  created_at: string;
};

export type Ejercicio = {
  nombre: string;
  series: string;
  reps: string;
  notas?: string;
};

export type DiaEntrenamiento = {
  dia: string;
  ejercicios: Ejercicio[];
};

export type TrainingPlanContent = {
  resumen: string;
  dias: DiaEntrenamiento[];
};

export type TrainingPlanSource = "ia" | "manual";

export type TrainingPlan = {
  id: string;
  client_id: string;
  admin_id: string | null;
  request_id: string | null;
  title: string;
  contenido: TrainingPlanContent;
  source: TrainingPlanSource;
  created_at: string;
};
