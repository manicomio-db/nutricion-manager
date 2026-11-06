import { requireClient } from "@/lib/supabase/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export default async function ClienteCuentaPage() {
  const { profile } = await requireClient();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mi cuenta" subtitle="Tus datos de acceso." />

      <Card>
        <CardHeader>
          <CardTitle>Datos de acceso</CardTitle>
          <CardDescription>
            Nombre: <strong className="text-foreground">{profile.full_name ?? "—"}</strong> · Usuario:{" "}
            <strong className="text-foreground">{profile.username ?? "—"}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>
            Escribe tu contraseña actual y elige una nueva. Si la olvidaste, pídele a tu nutriólogo que te genere
            una.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
