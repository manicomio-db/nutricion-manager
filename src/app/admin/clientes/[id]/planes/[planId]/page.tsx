import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Food, NutritionPlan } from "@/lib/types";
import { PlanEditor } from "../plan-editor";

export default async function EditarPlanPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>;
}) {
  const { id, planId } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: plan }, { data: foods }] = await Promise.all([
    supabase.from("nutrition_plans").select("*").eq("id", planId).single<NutritionPlan>(),
    supabase.from("foods").select("*").order("nombre", { ascending: true }).returns<Food[]>(),
  ]);

  if (!plan) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Editar plan</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{plan.title}</CardTitle>
          <CardDescription>Configura las comidas y elige alimentos del catálogo por gramaje.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlanEditor
            clientId={id}
            planId={plan.id}
            foods={foods ?? []}
            initialTitle={plan.title}
            initialComidas={plan.comidas}
          />
        </CardContent>
      </Card>
    </div>
  );
}
