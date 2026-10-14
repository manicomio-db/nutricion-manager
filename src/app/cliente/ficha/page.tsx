import { requireClient } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { HealthProfile } from "@/lib/types";
import { HealthProfileForm } from "../../health-profile-form";

export default async function ClienteFichaPage() {
  const { profile, supabase } = await requireClient();

  const { data: health } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("client_id", profile.id)
    .maybeSingle<HealthProfile>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi ficha de salud</h1>
        <p className="text-muted-foreground">
          Con esta información tu nutriólogo adapta tu dieta y tu entrenamiento a tu edad, condición y lesiones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{health ? "Actualiza tu ficha" : "Llena tu ficha"}</CardTitle>
          <CardDescription>
            {health
              ? `Última actualización: ${new Date(health.updated_at).toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}`
              : "Es necesaria para pedir un plan. Tus datos solo los ve tu nutriólogo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HealthProfileForm initial={health ?? null} maxDate={todayLocal()} />
        </CardContent>
      </Card>
    </div>
  );
}
