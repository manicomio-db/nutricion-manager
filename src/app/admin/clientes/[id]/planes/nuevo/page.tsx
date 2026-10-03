import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Food, ProgressLog, Profile } from "@/lib/types";
import { PlanEditor } from "../plan-editor";
import { NutritionAiComposer } from "../../nutrition-ai-composer";

export default async function NuevoPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: foods }, { data: client }, { data: latestLog }] = await Promise.all([
    supabase.from("foods").select("*").order("nombre", { ascending: true }).returns<Food[]>(),
    supabase.from("profiles").select("*").eq("id", id).single<Profile>(),
    supabase
      .from("progress_logs")
      .select("*")
      .eq("client_id", id)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle<ProgressLog>(),
  ]);

  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo plan nutricional</h1>
        <p className="text-muted-foreground">
          Genera el plan con IA ahora mismo o ármalo a mano, sin esperar una solicitud del cliente.
        </p>
      </div>

      <NutritionAiComposer
        request={{
          id: null,
          clientId: id,
          clientNombre: client.full_name ?? "Cliente",
          objetivo: client.objetivo ?? "",
          restricciones: client.restricciones,
          comidasDia: 4,
          notas: null,
          status: "directo",
          alturaCm: client.altura_cm,
          pesoKg: latestLog?.peso_kg ?? null,
          grasaPct: latestLog?.grasa_pct ?? null,
          grasaVisceral: latestLog?.grasa_visceral ?? null,
          masaMuscularKg: latestLog?.masa_muscular_kg ?? null,
          aguaCorporalL: latestLog?.agua_corporal_l ?? null,
          tasaMetabolicaKcal: latestLog?.tasa_metabolica_kcal ?? null,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Armar plan manualmente</CardTitle>
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
