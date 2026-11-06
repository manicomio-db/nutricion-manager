import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TrainingPlan } from "@/lib/types";
import { TrainingPlanEditor } from "../training-plan-editor";

export default async function EditarPlanEntrenamientoPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>;
}) {
  const { id, planId } = await params;
  const { supabase } = await requireAdmin();

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("id", planId)
    .eq("client_id", id)
    .single<TrainingPlan>();

  if (!plan) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={<>Editar plan de entrenamiento</>} />
      <Card>
        <CardHeader>
          <CardTitle>{plan.title}</CardTitle>
          <CardDescription>
            Los cambios los ve el cliente en cuanto guardes. Los registros de progreso que ya anotó se conservan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingPlanEditor
            planId={plan.id}
            clientId={id}
            initialTitle={plan.title}
            initialContenido={plan.contenido}
          />
        </CardContent>
      </Card>
    </div>
  );
}
