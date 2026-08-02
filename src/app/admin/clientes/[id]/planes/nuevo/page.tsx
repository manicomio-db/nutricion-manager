import { requireAdmin } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Food } from "@/lib/types";
import { PlanEditor } from "../plan-editor";

export default async function NuevoPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: foods } = await supabase
    .from("foods")
    .select("*")
    .order("nombre", { ascending: true })
    .returns<Food[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo plan nutricional</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Armar plan</CardTitle>
          <CardDescription>Configura las comidas y elige alimentos del catálogo por gramaje.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlanEditor
            clientId={id}
            foods={foods ?? []}
            initialTitle="Plan nutricional"
            initialComidas={[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
